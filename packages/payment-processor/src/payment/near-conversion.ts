import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ChainTypes, ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import {
  getAmountToPay,
  getPaymentExtensionVersion,
  getRequestPaymentValues,
  validateRequest,
} from './utils';
import { INearTransactionCallback, processNearPaymentWithConversion } from './utils-near';
import { IConversionPaymentSettings } from '.';
import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { ChainManager } from '@requestnetwork/chain';

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
  callback?: INearTransactionCallback,
): Promise<void> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN);

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

  if (
    !network ||
    !ChainManager.current().ecosystems[ChainTypes.ECOSYSTEM.NEAR].isChainSupported(network)
  ) {
    throw new Error('Should be a Near network');
  }
  const chain = ChainManager.current().fromName(network, [ChainTypes.ECOSYSTEM.NEAR]);

  const amountToPay = getAmountToPay(request, amount).toString();
  const version = getPaymentExtensionVersion(request);

  return processNearPaymentWithConversion(
    walletConnection,
    chain,
    amountToPay,
    paymentAddress,
    paymentReference,
    getTicker(request.currencyInfo),
    feeAddress || '0x',
    feeAmount || 0,
    paymentSettings.maxToSpend,
    maxRateTimespan || '0',
    version,
    callback,
  );
}

// FIXME: the previous oracle worked with ticker, this could be deprecated with the next oracle we implement.
const getTicker = (currency: RequestLogicTypes.ICurrency): string => {
  switch (currency.type) {
    case RequestLogicTypes.CURRENCY.ISO4217:
      return currency.value;
    default:
      // Warning: the request contract for native payments and conversions only handles 2 decimals, not suited for cryptos.
      throw new Error('Near payment with conversion only implemented for fiat denominations.');
  }
};
