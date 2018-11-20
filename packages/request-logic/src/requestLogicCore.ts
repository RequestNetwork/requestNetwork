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
  getRequestIdFromTransaction,
};

/**
 * Function Entry point to apply any transaction to a request
 *
 * @param Types.IRequestLogicRequest request The request before update, null for creation - will not be modified
 * @param Types.IRequestLogicTransaction transaction The transaction to apply
 *
 * @returns Types.IRequestLogicRequest  The request updated
 */
function applyTransactionToRequest(
  request: Types.IRequestLogicRequest | null,
  transaction: Types.IRequestLogicTransaction,
): Types.IRequestLogicRequest {
  if (!Transaction.isSignedTransactionVersionSupported(transaction)) {
    throw new Error('transaction version not supported');
  }

  // we don't want to modify the original request state
  const requestCopied: Types.IRequestLogicRequest | null = request ? Utils.deepCopy(request) : null;

  // Creation request
  if (transaction.data.action === Types.REQUEST_LOGIC_ACTION.CREATE) {
    if (requestCopied) {
      throw new Error('no request is expected at the creation');
    }
    return CreateAction.createRequest(transaction);
  }

  // Update request
  if (!requestCopied) {
    throw new Error('request is expected');
  }

  // Will throw if the request is not valid
  Request.checkRequest(requestCopied);

  if (transaction.data.action === Types.REQUEST_LOGIC_ACTION.ACCEPT) {
    return AcceptAction.applyTransactionToRequest(transaction, requestCopied);
  }

  if (transaction.data.action === Types.REQUEST_LOGIC_ACTION.CANCEL) {
    return CancelAction.applyTransactionToRequest(transaction, requestCopied);
  }

  if (transaction.data.action === Types.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT) {
    return IncreaseExpectedAmountAction.applyTransactionToRequest(transaction, requestCopied);
  }

  if (transaction.data.action === Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT) {
    return ReduceExpectedAmountAction.applyTransactionToRequest(transaction, requestCopied);
  }

  throw new Error(`Unknown action ${transaction.data.action}`);
}

/**
 * Function to create a requestId from the creation transaction or get the requestId parameter otherwise
 *
 * @param IRequestLogicTransaction transaction transaction
 *
 * @returns RequestIdTYpe the requestId
 */
function getRequestIdFromTransaction(
  transaction: Types.IRequestLogicTransaction,
): Types.RequestLogicRequestId {
  return Transaction.getRequestId(transaction);
}
