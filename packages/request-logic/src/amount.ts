import { RequestLogic as Types } from '@requestnetwork/types';
const bigNumber: any = require('bn.js');
import Utils from '@requestnetwork/utils';

/**
 * Function to manage amounts
 */
export default {
  add,
  isValid,
  reduce,
};

const regexInteger = RegExp(/^[\d]+$/);

/**
 * Function to check if the amount is valid (representation of a positive integer)
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
 * Function to add an amount by another
 *
 * @param RequestLogicAmount amount the base amount (positve integer)
 * @param RequestLogicAmount delta the amount to add (positve integer)
 *
 * @returns string the new amount in a string format
 */
function add(amount: Types.RequestLogicAmount, delta: Types.RequestLogicAmount): string {
  if (!isValid(amount)) {
    throw Error('amount must represent a positive integer');
  }
  if (!isValid(delta)) {
    throw Error('delta must represent a positive integer');
  }

  amount = new bigNumber(amount);
  delta = new bigNumber(delta);
  return amount.add(delta).toString();
}

/**
 * Function to reduce an amount by another
 *
 * Throw if the new amount is not valid (i.e: negative..)
 *
 * @param RequestLogicAmount amount the base amount (positve integer)
 * @param RequestLogicAmount delta the amount to reduce (positve integer)
 *
 * @returns string the new amount in a string format
 */
function reduce(amount: Types.RequestLogicAmount, delta: Types.RequestLogicAmount): string {
  if (!isValid(amount)) {
    throw Error('amount must represent a positive integer');
  }
  if (!isValid(delta)) {
    throw Error('delta must represent a positive integer');
  }

  amount = new bigNumber(amount);
  delta = new bigNumber(delta);
  const newAmount = amount.sub(delta).toString();

  // Check if the new amount is valid (basically it is not negative)
  if (!isValid(newAmount)) {
    throw Error('result of reduce is not valid');
  }
  return newAmount;
}
