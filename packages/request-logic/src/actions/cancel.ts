import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Request from '../request';
import Signature from '../signature';
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
 * @returns ISignedTransaction  the transaction with the signature
 */
function format(
  cancelParameters: Types.IRequestLogicCancelParameters,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignedTransaction {
  const transaction: Types.IRequestLogicTransaction = {
    action: Types.REQUEST_LOGIC_ACTION.CANCEL,
    parameters: cancelParameters,
    version: Version.currentVersion,
  };

  return Transaction.createSignedTransaction(transaction, signatureParams);
}

/**
 * Function to apply an Cancel transaction an a request
 *
 * @param Types.IRequestLogicSignedTransaction signedTransaction the signed transaction to apply
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function applyTransactionToRequest(
  signedTransaction: Types.IRequestLogicSignedTransaction,
  request: Types.IRequestLogicRequest,
): Types.IRequestLogicRequest {
  const transaction = signedTransaction.transaction;

  if (!transaction.parameters.requestId) {
    throw new Error('requestId must be given');
  }

  const signer: Types.IRequestLogicIdentity = Transaction.getSignerIdentityFromSignedTransaction(
    signedTransaction,
  );
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensions(request, transaction.parameters.extensions);
  request.events.push(generateEvent(transaction, signer));

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
 * @param Types.IRequestLogicTransaction transaction the transaction that create the event
 * @param Types.IRequestLogicIdentity transactionSigner the signer of the transaction
 *
 * @returns Types.IRequestLogicEvent the event generated
 */
function generateEvent(
  transaction: Types.IRequestLogicTransaction,
  transactionSigner: Types.IRequestLogicIdentity,
): Types.IRequestLogicEvent {
  const params = transaction.parameters;

  const event: Types.IRequestLogicEvent = {
    name: Types.REQUEST_LOGIC_ACTION.CANCEL,
    parameters: {
      extensionsLength: params.extensions ? params.extensions.length : 0,
    },
    transactionSigner,
  };
  return event;
}
