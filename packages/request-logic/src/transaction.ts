import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Role from './role';
import Signature from './signature';
import Version from './version';

/**
 * Function to manage Request logic transactions
 */
export default {
  createTransaction,
  getRequestId,
  getRoleInTransaction,
  getSignerIdentityFromTransaction,
  getVersionFromTransaction,
  getVersionFromTransactionData,
  isSignedTransactionVersionSupported,
  isTransactionVersionSupported,
};

/**
 * Function to create transaction from a transaction and Signature parameters
 *
 * @notice it will sign the hash (keccak256) of the transaction
 *
 * @param ITransaction transaction The transaction to signed
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns string the transaction with the signature
 */
function createTransaction(
  data: Types.IRequestLogicTransactionData,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicTransaction {
  const signature = Signature.sign(Utils.crypto.normalizeKeccak256Hash(data), signatureParams);
  return { data, signature };
}

/**
 * Function to get the signer identity from a transaction
 *
 * @param ISignatureParameters   transaction    transaction to check
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE    the role of the signer (payee, payer or thirdpart)
 */
function getSignerIdentityFromTransaction(
  transaction: Types.IRequestLogicTransaction,
): Types.IRequestLogicIdentity {
  return Signature.recover(
    Utils.crypto.normalizeKeccak256Hash(transaction.data),
    transaction.signature,
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
  transaction: Types.IRequestLogicTransactionData,
): Types.REQUEST_LOGIC_ROLE {
  return Role.getRole(identity, transaction.parameters);
}

/**
 * Function to create a requestId from the creation transaction or get the requestId parameter otherwise
 *
 * @param IRequestLogicTransactionData creation transaction of the request
 *
 * @returns RequestIdTYpe the requestId
 */
function getRequestId(
  transaction: Types.IRequestLogicTransactionData,
): Types.RequestLogicRequestId {
  if (transaction.action === Types.REQUEST_LOGIC_ACTION.CREATE) {
    return Utils.crypto.normalizeKeccak256Hash(transaction);
  }
  return transaction.parameters.requestId;
}

/**
 * Function to check if a transaction is supported
 *
 * @param IRequestLogicTransaction transaction transaction to check
 *
 * @returns boolean true, if transaction is supported false otherwise
 */
function isSignedTransactionVersionSupported(transaction: Types.IRequestLogicTransaction): boolean {
  return Version.isSupported(transaction.data.version);
}

/**
 * Function to check if a transaction is supported
 *
 * @param IRequestLogicTransaction transaction transaction to check
 *
 * @returns boolean true, if transaction is supported false otherwise
 */
function isTransactionVersionSupported(transaction: Types.IRequestLogicTransactionData): boolean {
  return Version.isSupported(transaction.version);
}

/**
 * Function to get the version of a transaction data
 *
 * @param IRequestLogicTransactionData data data to check
 *
 * @returns string version
 */
function getVersionFromTransactionData(data: Types.IRequestLogicTransactionData): string {
  return data.version;
}

/**
 * Function to get the version of a transaction
 *
 * @param IRequestLogicTransaction transaction transaction to check
 *
 * @returns string version
 */
function getVersionFromTransaction(transaction: Types.IRequestLogicTransaction): string {
  return transaction.data.version;
}
