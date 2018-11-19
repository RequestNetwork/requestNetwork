import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Request from './request';
import Transaction from './transaction';

import AcceptAction from './actions/accept';
import CancelAction from './actions/cancel';
import CreateAction from './actions/create';
import IncreaseExpectedAmountAction from './actions/increaseExpectedAmount';
import ReduceExpectedAmountAction from './actions/reduceExpectedAmount';

/**
 * Implementation of the request logic specification
 */
export default {
  applyTransactionToRequest,
  formatAccept: AcceptAction.format,
  formatCancel: CancelAction.format,
  formatCreate: CreateAction.format,
  formatIncreaseExpectedAmount: IncreaseExpectedAmountAction.format,
  formatReduceExpectedAmount: ReduceExpectedAmountAction.format,
  getRequestIdFromSignedTransaction,
};

/**
 * Function Entry point to apply any signed transaction to a request
 *
 * @param Types.IRequestLogicRequest request The request before update, null for creation - will not be modified
 * @param Types.IRequestLogicSignedTransaction signedTransaction The signed transaction to apply
 *
 * @returns Types.IRequestLogicRequest  The request updated
 */
function applyTransactionToRequest(
  request: Types.IRequestLogicRequest | null,
  signedTransaction: Types.IRequestLogicSignedTransaction,
): Types.IRequestLogicRequest {
  if (!Transaction.isSignedTransactionVersionSupported(signedTransaction)) {
    throw new Error('signed transaction version not supported');
  }

  // we don't want to modify the original request state
  const requestCopied: Types.IRequestLogicRequest | null = request ? Utils.deepCopy(request) : null;

  // Creation request
  if (signedTransaction.transaction.action === Types.REQUEST_LOGIC_ACTION.CREATE) {
    if (requestCopied) {
      throw new Error('no request is expected at the creation');
    }
    return CreateAction.createRequest(signedTransaction);
  }

  // Update request
  if (!requestCopied) {
    throw new Error('request is expected');
  }

  // Will throw if the request is not valid
  Request.checkRequest(requestCopied);

  if (signedTransaction.transaction.action === Types.REQUEST_LOGIC_ACTION.ACCEPT) {
    return AcceptAction.applyTransactionToRequest(signedTransaction, requestCopied);
  }

  if (signedTransaction.transaction.action === Types.REQUEST_LOGIC_ACTION.CANCEL) {
    return CancelAction.applyTransactionToRequest(signedTransaction, requestCopied);
  }

  if (
    signedTransaction.transaction.action === Types.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT
  ) {
    return IncreaseExpectedAmountAction.applyTransactionToRequest(signedTransaction, requestCopied);
  }

  if (signedTransaction.transaction.action === Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT) {
    return ReduceExpectedAmountAction.applyTransactionToRequest(signedTransaction, requestCopied);
  }

  throw new Error(`Unknown action ${signedTransaction.transaction.action}`);
}

/**
 * Function to create a requestId from the creation transaction or get the requestId parameter otherwise
 *
 * @param IRequestLogicSignedTransaction signedTransaction signed transaction
 *
 * @returns RequestIdTYpe the requestId
 */
function getRequestIdFromSignedTransaction(
  signedTransaction: Types.IRequestLogicSignedTransaction,
): Types.RequestLogicRequestId {
  return Transaction.getRequestId(signedTransaction.transaction);
}
