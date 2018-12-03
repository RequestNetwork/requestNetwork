import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Request from '../request';
import Transaction from '../transaction';
import Version from '../version';

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
 * @param IRequestLogicAcceptParameters acceptParameters parameters to accept a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns IRequestLogicTransaction  the transaction with the signature
 */
function format(
  acceptParameters: Types.IRequestLogicAcceptParameters,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestLogicTransaction {
  const transaction: Types.IRequestLogicTransactionData = {
    action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
    parameters: acceptParameters,
    version: Version.currentVersion,
  };

  return Transaction.createTransaction(transaction, signatureParams);
}

/**
 * Function to apply an Accept transaction on a request
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

  if (!request.payer) {
    throw new Error('the request must have a payer');
  }

  if (request.state !== Types.REQUEST_LOGIC_STATE.CREATED) {
    throw new Error('the request state must be created');
  }

  const signer: IdentityTypes.IIdentity = Transaction.getSignerIdentityFromTransaction(transaction);
  const signerRole = Request.getRoleInRequest(signer, request);

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    request.state = Types.REQUEST_LOGIC_STATE.ACCEPTED;
  } else {
    throw new Error('Signer must be the payer');
  }

  request = Request.pushExtensionsData(request, transactionData.parameters.extensionsData);
  request.events.push(generateEvent(transactionData, signer));

  return request;
}

/**
 * Private function to generate the event 'Accept' from a transaction
 *
 * @param Types.IRequestLogicTransactionData transaction the transaction that create the event
 * @param IdentityTypes.IIdentity transactionSigner the signer of the transaction
 *
 * @returns Types.IRequestLogicEvent the event generated
 */
function generateEvent(
  transaction: Types.IRequestLogicTransactionData,
  transactionSigner: IdentityTypes.IIdentity,
): Types.IRequestLogicEvent {
  const params = transaction.parameters;

  const event: Types.IRequestLogicEvent = {
    name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    transactionSigner,
  };
  return event;
}
