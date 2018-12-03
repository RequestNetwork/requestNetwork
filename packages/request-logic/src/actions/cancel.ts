import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Request from '../request';
import Transaction from '../transaction';
import Version from '../version';

/**
 * Implementation of the action cancel from request logic specification
 */
export default {
  applyTransactionToRequest,
  format,
};

/**
 * Function to format a transaction to cancel a Request
 *
 * @param IRequestLogicCancelParameters cancelParameters parameters to cancel a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns IRequestLogicTransaction  the transaction with the signature
 */
function format(
  cancelParameters: Types.IRequestLogicCancelParameters,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestLogicTransaction {
  const transaction: Types.IRequestLogicTransactionData = {
    action: Types.REQUEST_LOGIC_ACTION.CANCEL,
    parameters: cancelParameters,
    version: Version.currentVersion,
  };

  return Transaction.createTransaction(transaction, signatureParams);
}

/**
 * Function to apply an Cancel transaction an a request
 *
 * @param Types.IRequestLogicTransaction transaction the transaction to apply
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function applyTransactionToRequest(
  transaction: Types.IRequestLogicTransaction,
  request: Types.IRequestLogicRequest,
): Types.IRequestLogicRequest {
  const transactionData = transaction.data;

  if (!transactionData.parameters.requestId) {
    throw new Error('requestId must be given');
  }

  const signer: IdentityTypes.IIdentity = Transaction.getSignerIdentityFromTransaction(transaction);
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensionsData(request, transactionData.parameters.extensionsData);
  request.events.push(generateEvent(transactionData, signer));

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    if (request.state !== Types.REQUEST_LOGIC_STATE.CREATED) {
      throw new Error('A payer cancel need to be done on a request with the state created');
    }
    request.state = Types.REQUEST_LOGIC_STATE.CANCELLED;
    return request;
  }

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYEE) {
    if (request.state === Types.REQUEST_LOGIC_STATE.CANCELLED) {
      throw new Error('Cannot cancel an already cancelled request');
    }
    request.state = Types.REQUEST_LOGIC_STATE.CANCELLED;
    return request;
  }

  throw new Error('Signer must be the payer or the payee');
}

/**
 * Private function to generate the event 'Cancel' from a transaction
 *
 * @param Types.IRequestLogicTransactionData transaction the transaction that create the event
 * @param IdentityTypes.IIdentity transactionSigner the signer of the transaction
 *
 * @returns Types.IRequestLogicEvent the event generated
 */
function generateEvent(
  transactionData: Types.IRequestLogicTransactionData,
  transactionSigner: IdentityTypes.IIdentity,
): Types.IRequestLogicEvent {
  const params = transactionData.parameters;

  const event: Types.IRequestLogicEvent = {
    name: Types.REQUEST_LOGIC_ACTION.CANCEL,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    transactionSigner,
  };
  return event;
}
