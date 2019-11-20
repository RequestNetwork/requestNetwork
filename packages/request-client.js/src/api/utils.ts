import Utils from '@requestnetwork/utils';
import { getDecimalsForCurrency } from './currency';
/**
 * Collection of utils functions related to the library, meant to simplify its use.
 */
export default {
  getDecimalsForCurrency,

  /**
   * Returns the current timestamp in second
   *
   * @returns current timestamp in second
   */
  getCurrentTimestampInSecond: Utils.getCurrentTimestampInSecond,
};
