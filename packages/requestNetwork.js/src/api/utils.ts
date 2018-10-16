import Web3Single from '../servicesExternal/web3-single';
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

    /**
     * Check if the value is a positive amount.
     * It means the value is:
     * - A positive integer.
     * - A position string number.
     * - A positive BigNumber.
     * @param   _amount value to check
     * @return  true if _amount is a positive amount
     */
    isPositiveAmount(_amount: Types.Amount): boolean {

        // Check type
        if (!Number.isInteger(_amount) && !Web3Single.isBigNumber(_amount) && !(typeof _amount === 'string' || _amount instanceof String)) {
            return false;
        }

        // Check if positive integer or string number
        if ((Number.isInteger(_amount) || typeof _amount === 'string' || _amount instanceof String)
            &&
            (isNaN(Number(_amount)) || Number(_amount) < 0)
        ) {
            return false;
        }

        // Check if positive BigNumber
        if (Web3Single.isBigNumber(_amount) && _amount.isNeg()) {
            return false;
        }

        return true;
    },

    /**
     * Check if the value is an array of positive amounts.
     * @param   _amount value to check
     * @return  true if _amountArray is an array of amounts
     */
    isArrayOfPositiveAmounts(_amountArray: Types.Amount): boolean {
        // Verify _amountArray is an array
        if (!Array.isArray(_amountArray)) {
            return false;
        }

        // Verify if _amountArray is only composed of positive amount
        if (!_amountArray.every(amount => this.isPositiveAmount(amount))) {
            return false;
        }

        return true;
    },

    /**
     * Check if the value is a payeeInfo dictionary.
     * @param   _payeeInfo dictionary to check
     * @return  true if _payeeInfo is a payeeInfo dictionary
     */
    isPayeeInfo(_payeeInfo: Types.IPayee): boolean {
        // Check required fiels exist
        if (!(_payeeInfo.idAddress && _payeeInfo.paymentAddress && _payeeInfo.expectedAmount)) {
            return false;
        }

        // Check idAddress field
        if ((typeof _payeeInfo.idAddress !== 'string')) {
            return false;
        }

        // Check paymentAddress field
        if ((typeof _payeeInfo.paymentAddress !== 'string')) {
            return false;
        }

        // Check expectedAmount is positive numbers
        if (!this.isPositiveAmount(_payeeInfo.expectedAmount)) {
            return false;
        }

        return true;
    },

    /**
     * Check if the value is an array of PayeeInfo.
     * @param   _amount value to check
     * @return  true if _payeeInfoArray is an array of PayeeInfo
     */
    isArrayOfPayeeInfos(_payeeInfoArray: Types.IPayee[]): boolean {
        // Verify _payeeInfoArray is an array
        if (!Array.isArray(_payeeInfoArray)) {
            return false;
        }

        // Verify if _payeeInfoArray is an array of PayeeInfo
        if (!_payeeInfoArray.every(payeeInfo => this.isPayeeInfo(payeeInfo))) {
            return false;
        }

        return true;
    },

    /**
     * Check if the value is a payerInfo dictionary.
     * @param   _payerInfo dictionary to check
     * @return  true if _payerInfo is a payerInfo dictionary
     */
    isPayerInfo(_payerInfo: Types.IPayer): boolean {
        // idAddress is a required field
        if (!_payerInfo.idAddress) {
            return false;
        }

        // Check idAddress field
        if ((typeof _payerInfo.idAddress !== 'string')) {
            return false;
        }
        const tetet = _payerInfo.refundAddress;
        // Check refundAddress optional field
        if (_payerInfo.refundAddress) {
            if (typeof _payerInfo.refundAddress !== 'string') {
                return false;
            }
        }

        // Check bitcoinRefundAddresses optional field
        if (_payerInfo.bitcoinRefundAddresses) {
            if (!Array.isArray(_payerInfo.bitcoinRefundAddresses) || (_payerInfo.bitcoinRefundAddresses.length > 0 && (typeof _payerInfo.bitcoinRefundAddresses[0] !== 'string'))) {
                return false;
            }
        }

        return true;
    },
};
