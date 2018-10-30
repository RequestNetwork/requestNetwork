const bigNumber: any = require('bn.js');
import * as Types from '../types';
import Utils from './utils';

/**
 * Function to manage amounts
 */
export default {
  isValid,
};

const regexInteger = RegExp(/^[\d]+$/);

/**
 * Function to check if the amount is valid
 *
 * @param RequestLogicAmount amount the amount to check
 *
 * @returns boolean true if amount is a valid amount
 */
function isValid(amount: Types.RequestLogicAmount): boolean {
  return (
    (bigNumber.isBN(amount) && !amount.isNeg()) ||
    (Utils.isString(amount) && regexInteger.test(amount)) ||
    (typeof amount === 'number' && (Number.isSafeInteger(Number(amount)) && Number(amount) >= 0))
  );
}
