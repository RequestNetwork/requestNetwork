import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getRequestPaymentValues,
  validateRequest,
  getAmountToPay,
  getPaymentExtensionVersion,
} from './utils';
import { isNearNetwork, processNearPayment } from './utils-near';

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
): Promise<void> {
  if (!request.currencyInfo.network || !isNearNetwork(request.currencyInfo.network)) {
    throw new Error('request.currencyInfo should be a Near network');
  }

  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN);

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
  );
}
