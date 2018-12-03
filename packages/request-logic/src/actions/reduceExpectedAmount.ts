import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Amount from '../amount';
import Request from '../request';
import Transaction from '../transaction';
import Version from '../version';

/**
 * Implementation of the action reduceExpectedAmount from request logic specification
 */
export default {
  applyTransactionToRequest,
  format,
};

/**
 * Function to format a transaction to reduce expected amount of a Request
 *
 * @param IRequestLogicReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns IRequestLogicTransaction  the transaction with the signature
 */
function format(
  reduceAmountParameters: Types.IRequestLogicReduceExpectedAmountParameters,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestLogicTransaction {
  if (!Amount.isValid(reduceAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const transaction: Types.IRequestLogicTransactionData = {
    action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
    parameters: reduceAmountParameters,
    version: Version.currentVersion,
  };

  return Transaction.createTransaction(transaction, signatureParams);
}

/**
 * Function to apply an reduceExpectedAmount transaction on a request
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
  if (!request.payee) {
    throw new Error('the request must have a payee');
  }
  if (!transactionData.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!Amount.isValid(transactionData.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: IdentityTypes.IIdentity = Transaction.getSignerIdentityFromTransaction(transaction);
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensionsData(request, transactionData.parameters.extensionsData);
  request.events.push(generateEvent(transactionData, signer));

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYEE) {
    if (request.state === Types.REQUEST_LOGIC_STATE.CANCELLED) {
      throw new Error('the request must not be cancelled');
    }
    // reduce the expected amount and store it as string or throw if the result is not valid
    request.expectedAmount = Amount.reduce(
      request.expectedAmount,
      transactionData.parameters.deltaAmount,
    );

    return request;
  }

  throw new Error('signer must be the payee');
}

/**
 * Private function to generate the event 'ReduceExpectedAmount' from a transaction
 *
 * @param Types.IRequestLogicTransactionData transactionData the transaction data that create the event
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
    name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
    parameters: {
      deltaAmount: transactionData.parameters.deltaAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    transactionSigner,
  };
  return event;
}
