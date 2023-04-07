import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import {
  getRequestPaymentValues,
  validateRequest,
  getAmountToPay,
  getPaymentExtensionVersion,
} from './utils';
import {
  INearTransactionCallback,
  isReceiverReady,
  processNearFungiblePayment,
} from './utils-near';
import { NearChains } from '@requestnetwork/currency';

/**
 * Processes the transaction to pay a request in fungible token on NEAR with fee (Erc20FeeProxy).
 * @param request the request to pay
 */
export async function payFungibleNearRequest(
  request: ClientTypes.IRequestData,
  walletConnection: WalletConnection,
  amount?: BigNumberish,
  callback?: INearTransactionCallback,
): Promise<void> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);

  const { paymentReference, paymentAddress, feeAddress, feeAmount, network } =
    getRequestPaymentValues(request);

  if (!paymentReference) {
    throw new Error('Cannot pay without a paymentReference');
  }

  if (!network || !NearChains.isChainSupported(network)) {
    throw new Error('Should be a Near network');
  }
  NearChains.assertChainSupported(network);

  const amountToPay = getAmountToPay(request, amount).toString();
  const version = getPaymentExtensionVersion(request);

  if (!(await isReceiverReady(walletConnection, request.currencyInfo.value, paymentAddress))) {
    throw new Error(
      `The paymentAddress is not registered for the token ${request.currencyInfo.value}`,
    );
  }

  return processNearFungiblePayment(
    walletConnection,
    network,
    amountToPay,
    paymentAddress,
    paymentReference,
    request.currencyInfo.value,
    feeAddress || '0x',
    feeAmount || 0,
    version,
    callback,
  );
}
