import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getRequestPaymentValues, validateRequest } from './utils';
import { INearTransactionCallback, processNearPayment } from './utils-near';
import { NearChains } from '@requestnetwork/currency';
import { validatePaymentReference } from '../utils/validation';

/**
 * Processes the transaction to pay a declarative request with NEAR tokens.
 * @param request the request to pay, must be declarative, with payment values on a Near network.
 * @param walletConnection the Near provider.
 * @param amount amount to pay, in NEAR tokens.
 */
export async function payNearAnyDeclarativeRequest(
  request: ClientTypes.IRequestData,
  walletConnection: WalletConnection,
  amount: BigNumberish,
  callback?: INearTransactionCallback,
): Promise<void> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE);

  const { paymentReference, paymentAddress, network } = getRequestPaymentValues(request);

  validatePaymentReference(paymentReference);
  NearChains.assertChainSupported(network);

  return processNearPayment(
    walletConnection,
    network,
    amount,
    paymentAddress,
    paymentReference,
    '0.2.0',
    callback,
  );
}
