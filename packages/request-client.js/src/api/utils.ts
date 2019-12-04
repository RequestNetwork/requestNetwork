import { RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { getDecimalsForCurrency } from './currency';
/**
 * Collection of utils functions related to the library, meant to simplify its use.
 */
export default {
  formatGetRequestFromIdError,
  getDecimalsForCurrency,

  /**
   * Returns the current timestamp in second
   *
   * @returns current timestamp in second
   */
  getCurrentTimestampInSecond: Utils.getCurrentTimestampInSecond,
};

/**
 * Formats a human readable message from ignored transactions
 *
 * @param requestAndMeta return from GetRequestFromId
 * @returns human readable message
 */
function formatGetRequestFromIdError(
  requestAndMeta: RequestLogicTypes.IReturnGetRequestFromId,
): string {
  if (
    (requestAndMeta.meta.ignoredTransactions &&
      requestAndMeta.meta.ignoredTransactions.length !== 0) ||
    requestAndMeta.meta.transactionManagerMeta.ignoredTransactions.length !== 0
  ) {
    return `Invalid transaction(s) found: ${JSON.stringify(
      requestAndMeta.meta.transactionManagerMeta.ignoredTransactions
        .concat(requestAndMeta.meta.ignoredTransactions || [])
        .filter((tx: any) => tx !== null),
    )}`;
  }

  return 'No transaction found';
}
