import { Signature as SignatureTypes, Transaction as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

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
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns ITransaction the transaction with the signature
 */
function createTransaction(
  data: Types.ITransactionData,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.ITransaction {
  const signature = Utils.signature.sign(
    Utils.crypto.normalizeKeccak256Hash(data),
    signatureParams,
  );
  return { data, signature };
}
