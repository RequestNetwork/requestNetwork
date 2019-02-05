import { RequestLogic as RequestLogicTypes } from '@requestnetwork/types';

/**
 * Collection of utils functions related to the library, meant to simplify its use.
 */
export default {
  /**
   * Returns the number of decimals for a currency
   *
   * @param {RequestLogicTypes.REQUEST_LOGIC_CURRENCY} currency The currency
   * @returns {number}
   */
  getDecimalsForCurrency(currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY): number {
    const decimals = {
      [RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH]: 18,
      [RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC]: 8,
    }[currency];
    if (!decimals) {
      throw new Error(`Currency ${currency} not implemented`);
    }
    return decimals;
  },
};
