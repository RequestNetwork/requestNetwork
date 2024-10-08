import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import {
  getRequestPaymentValues,
  validateRequest,
  getAmountToPay,
  getPaymentExtensionVersion,
} from './utils';
import { INearTransactionCallback, processNearPaymentWithConversion } from './utils-near';
import { IConversionPaymentSettings } from '.';
import { CurrencyManager, NearChains, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { validatePaymentReference } from '../utils/validation';

/**
 * Processes the transaction to pay a request in NEAR with on-chain conversion.
 * @param request the request to pay
 * @param walletConnection the Near provider.
 * @param amount optionally, the amount to pay in request currency. Defaults to remaining amount of the request.
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

  validatePaymentReference(paymentReference);
  NearChains.assertChainSupported(network);

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
