import * as Types from '../types';
import currencyUtils from '../utils/currency';

/**
 * Collection of utils functions related to the library, meant to simplify its use.
 */
export default {
    /**
     * Return the number of decimals for a currency.
     *
     * @param {Types.Currency} currency The currency
     * @returns {number}
     */
    decimalsForCurrency: currencyUtils.decimalsForCurrency,
};
