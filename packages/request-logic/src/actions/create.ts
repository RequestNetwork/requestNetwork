import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Amount from '../amount';
import Signature from '../signature';
import Transaction from '../transaction';
import Version from '../version';

/**
 * Implementation of the request logic specification
 */
export default {
  createRequest,
  format,
};

/**
 * Function to format  transaction to create a Request
 *
 * @param requestParameters IRequestLogicCreateParameters parameters to create a request
 * @param IRequestLogicSignatureParameters signatureParams Signature parameters
 *
 *
 * @returns IRequestLogicTransaction  the transaction with the signature
 */
function format(
  requestParameters: Types.IRequestLogicCreateParameters,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicTransaction {
  if (!requestParameters.payee && !requestParameters.payer) {
    throw new Error('payee or PayerId must be given');
  }

  if (!Amount.isValid(requestParameters.expectedAmount)) {
    throw new Error('expectedAmount must be a positive integer');
  }

  if (
    requestParameters.payee &&
    requestParameters.payee.type !== Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw new Error('payee.type not supported');
  }

  if (
    requestParameters.payer &&
    requestParameters.payer.type !== Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw new Error('payer.type not supported');
  }

  // convert expectedAmount to string to have a consistent numbering
  requestParameters.expectedAmount = requestParameters.expectedAmount.toString();
  const version = Version.currentVersion;

  const transaction: Types.IRequestLogicTransactionData = {
    action: Types.REQUEST_LOGIC_ACTION.CREATE,
    parameters: requestParameters,
    version,
  };
  const signerIdentity: Types.IRequestLogicIdentity = Signature.getIdentityFromSignatureParams(
    signatureParams,
  );
  const signerRole: Types.REQUEST_LOGIC_ROLE = Transaction.getRoleInTransaction(
    signerIdentity,
    transaction,
  );

  if (
    signerRole !== Types.REQUEST_LOGIC_ROLE.PAYEE &&
    signerRole !== Types.REQUEST_LOGIC_ROLE.PAYER
  ) {
    throw new Error('Signer must be the payee or the payer');
  }

  return Transaction.createTransaction(transaction, signatureParams);
}

/**
 * Function to create a request (create a request)
 *
 * @param Types.IRequestLogicTransaction transaction the transaction to evaluate
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function createRequest(transaction: Types.IRequestLogicTransaction): Types.IRequestLogicRequest {
  const transactionData = transaction.data;

  if (!transactionData.parameters.payee && !transactionData.parameters.payer) {
    throw new Error(
      'transaction.data.parameters.payee or transaction.data.parameters.payer must be given',
    );
  }

  if (
    !Utils.isString(transactionData.parameters.expectedAmount) ||
    !Amount.isValid(transactionData.parameters.expectedAmount)
  ) {
    throw new Error(
      'transaction.data.parameters.expectedAmount must be a string representing a positive integer',
    );
  }

  const signer: Types.IRequestLogicIdentity = Transaction.getSignerIdentityFromTransaction(
    transaction,
  );

  // Copy to not modify the transaction itself
  const request: Types.IRequestLogicRequest = Utils.deepCopy(transactionData.parameters);
  request.requestId = Transaction.getRequestId(transactionData);
  request.version = Transaction.getVersionFromTransactionData(transactionData);
  request.events = [generateEvent(transactionData, signer)];

  const signerRole = Transaction.getRoleInTransaction(signer, transactionData);
  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYEE) {
    request.state = Types.REQUEST_LOGIC_STATE.CREATED;
    request.creator = transactionData.parameters.payee;
    return request;
  }
  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    request.state = Types.REQUEST_LOGIC_STATE.ACCEPTED;
    request.creator = transactionData.parameters.payer;
    return request;
  }

  throw new Error('Signer must be the payee or the payer');
}

/**
 * Private function to generate the event 'Create' from a transaction
 *
 * @param Types.IRequestLogicTransactionData transactionData the transaction data that create the event
 * @param Types.IRequestLogicIdentity transactionSigner the signer of the transaction
 *
 * @returns Types.IRequestLogicEvent the event generated
 */
function generateEvent(
  transactionData: Types.IRequestLogicTransactionData,
  transactionSigner: Types.IRequestLogicIdentity,
): Types.IRequestLogicEvent {
  const params = transactionData.parameters;

  const event: Types.IRequestLogicEvent = {
    name: Types.REQUEST_LOGIC_ACTION.CREATE,
    parameters: {
      expectedAmount: params.expectedAmount,
      extensionsLength: params.extensions ? params.extensions.length : 0,
      isSignedRequest: false,
    },
    transactionSigner,
  };
  return event;
}
