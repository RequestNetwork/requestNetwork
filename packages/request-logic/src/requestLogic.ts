import * as RequestEnum from './enum';
import * as Types from './types';
import Utils from './utils/utils';

import Create from './actions/create';

/**
 * Implementation of the request logic specification
 */
export default {
  applyTransactionToRequestState,
  formatCreate: Create.format,
};

/**
 * Function Entry point to apply any signed transaction to a state
 *
 * @param Types.IRequestLogicSignedTransaction signedTransaction The signed transaction to apply
 * @param Types.IRequestLogicRequest requestState The previous request state - will not be modified
 *
 * @returns Types.IRequestLogicRequest  The new request state
 */
function applyTransactionToRequestState(
  signedTransaction: Types.IRequestLogicSignedTransaction,
  request?: Types.IRequestLogicRequest,
): Types.IRequestLogicRequest {
  // we don't want to modify the original request state
  const requestUpdated: Types.IRequestLogicRequest | null = request
    ? Utils.deepCopy(request)
    : null;

  if (signedTransaction.transaction.action === RequestEnum.REQUEST_LOGIC_ACTION.CREATE) {
    if (requestUpdated) {
      throw new Error('no request state is expected at the creation');
    }
    return Create.createRequestState(signedTransaction);
  }

  throw new Error('Unknown action ${signedTransaction.transaction.action}');
}
