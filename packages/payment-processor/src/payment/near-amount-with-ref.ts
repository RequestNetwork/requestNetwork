import { BigNumberish } from 'ethers';
import { WalletConnection } from 'near-api-js';

import { CurrencyTypes } from '@requestnetwork/types';

import { INearTransactionCallback, processNearPayment } from './utils-near';
import { NearChains } from '@requestnetwork/currency';

/**
 * Processes a transaction to make a payment in NEAR token with a reference.
 *
 * @notice This is used to pay a declarative request, with low-level arguments.
 *
 * @param paymentAddress must be a valid NEAR address on the given network.
 * @param network e.g. 'near'
 * @param paymentReference used to index payments.
 * @param walletConnection the Near provider.
 * @param amount amount to pay, in NEAR tokens.
 */
// FIXME: We could improve the method's interface by enforcing a type on `paymentInfo` for declarative requests.
export async function payNearAmountWithReference(
  paymentAddress: string,
  paymentReference: string,
  network: CurrencyTypes.NearChainName,
  walletConnection: WalletConnection,
  amount: BigNumberish,
  callback?: INearTransactionCallback,
): Promise<void> {
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
