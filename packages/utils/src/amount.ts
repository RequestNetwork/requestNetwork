import { RequestLogicTypes } from '@requestnetwork/types';
import Utils from './utils';

const bigNumber: any = require('bn.js');

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
function isValid(amount: RequestLogicTypes.Amount): boolean {
  return (
    (Utils.isString(amount) && regexInteger.test(amount as string)) ||
    (typeof amount === 'number' && (Number.isSafeInteger(Number(amount)) && Number(amount) >= 0))
  );
}

/**
 * Function to add an amount by another
 *
 * @param RequestLogicAmount amount the base amount (positive integer)
 * @param RequestLogicAmount delta the amount to add (positive integer)
 *
 * @returns string the new amount in a string format
 */
function add(amount: RequestLogicTypes.Amount, delta: RequestLogicTypes.Amount): string {
  if (!isValid(amount)) {
    throw Error('amount must represent a positive integer');
  }
  if (!isValid(delta)) {
    throw Error('delta must represent a positive integer');
  }

  const amountBN: typeof bigNumber = new bigNumber(amount);
  const deltaBN: typeof bigNumber = new bigNumber(delta);
  return amountBN.add(deltaBN).toString();
}

/**
 * Function to reduce an amount by another
 *
 * Throw if the new amount is not valid (i.e: negative..)
 *
 * @param RequestLogicAmount amount the base amount (positive integer)
 * @param RequestLogicAmount delta the amount to reduce (positive integer)
 *
 * @returns string the new amount in a string format
 */
function reduce(amount: RequestLogicTypes.Amount, delta: RequestLogicTypes.Amount): string {
  if (!isValid(amount)) {
    throw Error('amount must represent a positive integer');
  }
  if (!isValid(delta)) {
    throw Error('delta must represent a positive integer');
  }

  const amountBN: typeof bigNumber = new bigNumber(amount);
  const deltaBN: typeof bigNumber = new bigNumber(delta);
  const newAmount = amountBN.sub(deltaBN).toString();

  // Check if the new amount is valid (basically it is not negative)
  if (!isValid(newAmount)) {
    throw Error('result of reduce is not valid');
  }
  return newAmount;
}
