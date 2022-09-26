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
 * processes the transaction to pay a Near with conversion request.
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
  if (!request.currencyInfo || request.currencyInfo.value !== 'USD') {
    throw new Error('request.currencyInfo should be USD');
  }
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
  const paymentCurrency = currencyManager.getNativeCurrency(
    RequestLogicTypes.CURRENCY.ETH,
    network,
  );
  if (!paymentCurrency) {
    throw new UnsupportedCurrencyError({ value: 'ETH', network });
  }

  const path = currencyManager.getConversionPath(requestCurrency, paymentCurrency, network);
  if (!path) {
    throw new Error(
      `Impossible to find a conversion path between from ${requestCurrency.symbol} (${requestCurrency.hash}) to ${paymentCurrency.symbol} (${paymentCurrency.hash})`,
    );
  }

  const amountToPay = getAmountToPay(request, amount).toString();
  const version = getPaymentExtensionVersion(request);

  return processNearPaymentWithConversion(
    walletConnection,
    network,
    amountToPay,
    paymentAddress,
    paymentReference,
    request.currencyInfo.value,
    feeAddress || '0x',
    feeAmount || 0,
    maxRateTimespan || '0',
    version,
  );
}
