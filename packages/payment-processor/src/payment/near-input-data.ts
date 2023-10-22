import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import {
  getAmountToPay,
  getPaymentExtensionVersion,
  getRequestPaymentValues,
  validateRequest,
} from './utils.js';
import { INearTransactionCallback, processNearPayment } from './utils-near.js';
import { NearChains } from '@requestnetwork/currency';

/**
 * processes the transaction to pay a Near request.
 * @param request the request to pay
 * @param walletConnection the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function payNearInputDataRequest(
  request: ClientTypes.IRequestData,
  walletConnection: WalletConnection,
  amount?: BigNumberish,
  callback?: INearTransactionCallback,
): Promise<void> {
  if (!request.currencyInfo.network || !NearChains.isChainSupported(request.currencyInfo.network)) {
    throw new Error('request.currencyInfo should be a Near network');
  }

  NearChains.assertChainSupported(request.currencyInfo.network);
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount).toString();
  const version = getPaymentExtensionVersion(request);
  if (!paymentReference) {
    throw new Error('Cannot pay without a paymentReference');
  }

  return processNearPayment(
    walletConnection,
    request.currencyInfo.network,
    amountToPay,
    paymentAddress,
    paymentReference,
    version,
    callback,
  );
}
