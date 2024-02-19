import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ChainTypes, ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import {
  getAmountToPay,
  getPaymentExtensionVersion,
  getRequestPaymentValues,
  validateRequest,
} from './utils';
import { INearTransactionCallback, processNearPayment } from './utils-near';
import { ChainManager } from '@requestnetwork/chain';

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
  if (
    !request.currencyInfo.network ||
    !ChainManager.current().ecosystems[ChainTypes.ECOSYSTEM.NEAR].isChainSupported(
      request.currencyInfo.network,
    )
  ) {
    throw new Error('request.currencyInfo should be a Near network');
  }

  const chain = ChainManager.current().fromName(request.currencyInfo.network, [
    ChainTypes.ECOSYSTEM.NEAR,
  ]);
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount).toString();
  const version = getPaymentExtensionVersion(request);
  if (!paymentReference) {
    throw new Error('Cannot pay without a paymentReference');
  }

  return processNearPayment(
    walletConnection,
    chain,
    amountToPay,
    paymentAddress,
    paymentReference,
    version,
    callback,
  );
}
