import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import {
  getRequestPaymentValues,
  validateRequest,
  getAmountToPay,
  getPaymentExtensionVersion,
} from './utils';
import { isNearNetwork, processNearPaymentWithConversion } from './utils-near';
import { IConversionPaymentSettings } from '.';
import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';

/**
 * Processes the transaction to pay a request in NEAR with on-chain conversion.
 * @param request the request to pay
 * @param walletConnection the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function payNearConversionRequest(
  request: ClientTypes.IRequestData,
  walletConnection: WalletConnection,
  paymentSettings: IConversionPaymentSettings,
  amount?: BigNumberish,
): Promise<void> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE);

  const currencyManager = paymentSettings.currencyManager || CurrencyManager.getDefault();
  const { paymentReference, paymentAddress, feeAddress, feeAmount, maxRateTimespan, network } =
    getRequestPaymentValues(request);

  const requestCurrency = currencyManager.fromStorageCurrency(request.currencyInfo);
  if (!requestCurrency) {
    throw new UnsupportedCurrencyError(request.currencyInfo);
  }

  if (!paymentReference) {
    throw new Error('Cannot pay without a paymentReference');
  }

  if (!network || !isNearNetwork(network)) {
    throw new Error('Should be a near network');
  }

  const amountToPay = getAmountToPay(request, amount).toString();
  const version = getPaymentExtensionVersion(request);

  return processNearPaymentWithConversion(
    walletConnection,
    network,
    amountToPay,
    paymentAddress,
    paymentReference,
    getTicker(request.currencyInfo),
    feeAddress || '0x',
    feeAmount || 0,
    maxRateTimespan || '0',
    version,
  );
}

const getTicker = (currency: RequestLogicTypes.ICurrency): string => {
  switch (currency.type) {
    case RequestLogicTypes.CURRENCY.ISO4217:
      return currency.value;
    default:
      // FIXME: Flux oracles are compatible with ERC20 identified by tickers. Ex: USDT, DAI.
      // Warning: although Flux oracles are compatible with ETH and BTC, the request contract
      // for native payments and conversions only handles 2 decimals, not suited for cryptos.
      throw new Error('Near payment with conversion only implemented for fiat denominations.');
  }
};
