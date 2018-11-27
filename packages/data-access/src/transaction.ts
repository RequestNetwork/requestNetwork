import {
  DataAccess as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Function to manage Request logic transactions
 */
export default {
  createTransaction,
};

/**
 * Function to create transaction from a transaction and Signature parameters
 *
 * @notice it will sign the hash (keccak256) of the transaction
 *
 * @param IRequestDataAccessTransactionData data The data to sign
 * @param IRequestDataAccessSignatureParameters signatureParams Signature parameters
 *
 * @returns string the transaction with the signature
 */
function createTransaction(
  data: Types.IRequestDataAccessTransactionData,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestDataAccessTransaction {
  const signature = Utils.signature.sign(
    Utils.crypto.normalizeKeccak256Hash(data),
    signatureParams,
  );
  return { data, signature };
}
