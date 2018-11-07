const bigNumber: any = require('bn.js');
import Utils from '@requestnetwork/utils';
import * as Types from './types';

/**
 * Function to manage amounts
 */
export default {
  add,
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

/**
 * Function to add amount by another
 *
 * @param RequestLogicAmount amount the base amount
 * @param RequestLogicAmount delta the amount to add
 *
 * @returns string the new amount in a string format
 */
function add(amount: Types.RequestLogicAmount, delta: Types.RequestLogicAmount): string {
  amount = new bigNumber(amount);
  delta = new bigNumber(delta);
  return amount.add(delta).toString();
}
