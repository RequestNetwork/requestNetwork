import Utils from '@requestnetwork/utils';
import * as RequestEnum from '../enum';
import Request from '../request';
import Signature from '../signature';
import Transaction from '../transaction';
import * as Types from '../types';

/**
 * Implementation of the action accept from request logic specification
 */
export default {
  applyTransactionToRequest,
  format,
};

/**
 * Function to format a transaction to accept a Request
 *
 * @param IRequestLogicRequestAcceptParameters acceptParameters parameters to accept a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns ISignedTransaction  the transaction with the signature
 */
function format(
  acceptParameters: Types.IRequestLogicRequestAcceptParameters,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignedTransaction {
  const transaction: Types.IRequestLogicTransaction = {
    action: RequestEnum.REQUEST_LOGIC_ACTION.ACCEPT,
    parameters: acceptParameters,
  };

  return Transaction.createSignedTransaction(transaction, signatureParams);
}

/**
 * Function to apply an Accept transaction an a request
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

  if (!request.payer) {
    throw new Error('the request must have a payer');
  }

  if (request.state !== RequestEnum.REQUEST_LOGIC_STATE.CREATED) {
    throw new Error('the request state must be created');
  }

  const signer: Types.IRequestLogicIdentity = Transaction.getSignerIdentityFromSignedTransaction(
    signedTransaction,
  );
  const signerRole = Request.getRoleInRequest(signer, request);

  if (signerRole === RequestEnum.REQUEST_LOGIC_ROLE.PAYER) {
    request.state = RequestEnum.REQUEST_LOGIC_STATE.ACCEPTED;
  } else {
    throw new Error('Signer must be the payer');
  }

  request = Request.pushExtensions(request, transaction.parameters.extensions);

  return request;
}
