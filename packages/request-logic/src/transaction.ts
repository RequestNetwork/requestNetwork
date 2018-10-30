import * as RequestEnum from './enum';
import Role from './role';
import Signature from './signature';
import * as Types from './types';
import Crypto from './utils/crypto';

/**
 * Function to manage Elliptic-curve cryptography
 */
export default {
  createSignedTransaction,
  getRequestId,
  getRoleInTransaction,
  getSignerIdentityFromSignedTransaction,
};

/**
 * Function to create signed transaction from a transaction and Signature parameters
 *
 * @notice it will sign the hash (keccak256) of the transaction
 *
 * @param ITransaction transaction The transaction to signed
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns string the transaction with the signature
 */
function createSignedTransaction(
  transaction: Types.IRequestLogicTransaction,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignedTransaction {
  const signature = Signature.sign(Crypto.normalizeKeccak256Hash(transaction), signatureParams);
  return { transaction, signature };
}

/**
 * Function to get the signer identity from a signed transaction
 *
 * @param ISignatureParameters   signedTransaction    Signed transaction to check
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE    the role of the signer (payee, payer or thirdpart)
 */
function getSignerIdentityFromSignedTransaction(
  signedTransaction: Types.IRequestLogicSignedTransaction,
): Types.IRequestLogicIdentity {
  return Signature.recover(
    Crypto.normalizeKeccak256Hash(signedTransaction.transaction),
    signedTransaction.signature,
  );
}

/**
 * Function to get the role of an identity in a transaction
 *
 * @param IIdentity identity the identity to check
 * @param ITransaction transaction the transaction
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE    the role of the signer (payee, payer or thirdpart)
 */
function getRoleInTransaction(
  identity: Types.IRequestLogicIdentity,
  transaction: Types.IRequestLogicTransaction,
): RequestEnum.REQUEST_LOGIC_ROLE {
  return Role.getRole(transaction.parameters, identity);
}

/**
 * Function to create a requestId from the creation transaction
 *
 * @param IRequestLogicTransaction creation transaction of the request
 *
 * @returns RequestIdTYpe the requestId generated
 */
function getRequestId(transaction: Types.IRequestLogicTransaction): Types.RequestLogicRequestId {
  return Crypto.normalizeKeccak256Hash(transaction);
}
