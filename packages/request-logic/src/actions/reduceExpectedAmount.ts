import Utils from '@requestnetwork/utils';
import Amount from '../amount';
import * as RequestEnum from '../enum';
import Request from '../request';
import Signature from '../signature';
import Transaction from '../transaction';
import * as Types from '../types';
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
 * @returns ISignedTransaction  the transaction with the signature
 */
function format(
  reduceAmountParameters: Types.IRequestLogicReduceExpectedAmountParameters,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignedTransaction {
  if (!Amount.isValid(reduceAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const transaction: Types.IRequestLogicTransaction = {
    action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
    parameters: reduceAmountParameters,
    version: Version.currentVersion,
  };

  return Transaction.createSignedTransaction(transaction, signatureParams);
}

/**
 * Function to apply an reduceExpectedAmount transaction on a request
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
  if (!request.payee) {
    throw new Error('the request must have a payee');
  }
  if (!transaction.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!Amount.isValid(transaction.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: Types.IRequestLogicIdentity = Transaction.getSignerIdentityFromSignedTransaction(
    signedTransaction,
  );
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensions(request, transaction.parameters.extensions);

  if (signerRole === RequestEnum.REQUEST_LOGIC_ROLE.PAYEE) {
    if (request.state === RequestEnum.REQUEST_LOGIC_STATE.CANCELLED) {
      throw new Error('the request must not be cancelled');
    }
    // reduce the expected amount and store it as string or throw if the result is not valid
    request.expectedAmount = Amount.reduce(
      request.expectedAmount,
      transaction.parameters.deltaAmount,
    );

    return request;
  }

  throw new Error('signer must be the payee');
}
