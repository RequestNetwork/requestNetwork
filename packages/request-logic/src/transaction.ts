import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Role from './role';
import Signature from './signature';
import Version from './version';

/**
 * Function to manage Request logic transactions
 */
export default {
  createSignedTransaction,
  getRequestId,
  getRoleInTransaction,
  getSignerIdentityFromSignedTransaction,
  getVersionFromSignedTransaction,
  getVersionFromTransaction,
  isSignedTransactionVersionSupported,
  isTransactionVersionSupported,
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
  const signature = Signature.sign(
    Utils.crypto.normalizeKeccak256Hash(transaction),
    signatureParams,
  );
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
    Utils.crypto.normalizeKeccak256Hash(signedTransaction.transaction),
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
): Types.REQUEST_LOGIC_ROLE {
  return Role.getRole(identity, transaction.parameters);
}

/**
 * Function to create a requestId from the creation transaction or get the requestId parameter otherwise
 *
 * @param IRequestLogicTransaction creation transaction of the request
 *
 * @returns RequestIdTYpe the requestId
 */
function getRequestId(transaction: Types.IRequestLogicTransaction): Types.RequestLogicRequestId {
  if (transaction.action === Types.REQUEST_LOGIC_ACTION.CREATE) {
    return Utils.crypto.normalizeKeccak256Hash(transaction);
  }
  return transaction.parameters.requestId;
}

/**
 * Function to check if a signed transaction is supported
 *
 * @param IRequestLogicSignedTransaction signedTransaction signed transaction to check
 *
 * @returns boolean true, if signed transaction is supported false otherwise
 */
function isSignedTransactionVersionSupported(
  signedTransaction: Types.IRequestLogicSignedTransaction,
): boolean {
  return Version.isSupported(signedTransaction.transaction.version);
}

/**
 * Function to check if a transaction is supported
 *
 * @param IRequestLogicSignedTransaction transaction transaction to check
 *
 * @returns boolean true, if transaction is supported false otherwise
 */
function isTransactionVersionSupported(transaction: Types.IRequestLogicTransaction): boolean {
  return Version.isSupported(transaction.version);
}

/**
 * Function to get the version of a transaction
 *
 * @param IRequestLogicSignedTransaction transaction transaction to check
 *
 * @returns string version
 */
function getVersionFromTransaction(transaction: Types.IRequestLogicTransaction): string {
  return transaction.version;
}

/**
 * Function to get the version of a signed transaction
 *
 * @param IRequestLogicSignedTransaction signedTransaction signed transaction to check
 *
 * @returns string version
 */
function getVersionFromSignedTransaction(
  signedTransaction: Types.IRequestLogicSignedTransaction,
): string {
  return signedTransaction.transaction.version;
}
