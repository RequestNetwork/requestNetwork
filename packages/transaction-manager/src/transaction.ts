import { TransactionTypes } from '@requestnetwork/types';

/**
 * Function to manage Request logic transactions
 */
export default {
  createTransaction,
};

/**
 * Function to create transaction from a data and Signature parameters
 *
 * @notice it will sign the hash (keccak256) of the transaction
 *
 * @param ITransactionData data The data to sign
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns ITransaction the transaction with the signature
 */
function createTransaction(data: TransactionTypes.ITransactionData): TransactionTypes.ITransaction {
  return { data };
}
