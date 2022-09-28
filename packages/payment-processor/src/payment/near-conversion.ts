import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getRequestPaymentValues,
  validateRequest,
  getAmountToPay,
  getPaymentExtensionVersion,
} from './utils';
import { isNearNetwork, processNearPaymentWithConversion } from './utils-near';
import { IConversionPaymentSettings } from '.';
import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { CURRENCY, ICurrency } from 'types/dist/request-logic-types';

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
  const {
    paymentReference,
    paymentAddress,
    feeAddress,
    feeAmount,
    maxRateTimespan,
    network,
  } = getRequestPaymentValues(request);

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

const getTicker = (currency: ICurrency): string => {
  switch (currency.type) {
    case CURRENCY.BTC:
    case CURRENCY.ETH:
    case CURRENCY.ISO4217:
      return currency.value;
    // FIXME: Flux oracles are compatible with ERC20 identified by tickers. Ex: USDT, DAI.
    default:
      throw new Error('Near payment with conversion not implemented for ERC20.');
  }
};
