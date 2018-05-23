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

    /**
     * Get the currency from the address of a currency contract.
     * Useful to know which currency was used to create a Request.
     *
     * @param {string} address Address of the currency contract
     * @returns {Types.Currency} Currency
     */
    currencyFromContractAddress: currencyUtils.currencyFromContractAddress,
};
