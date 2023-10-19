import { BigNumber } from 'ethers';

import { addAmount, isValidAmount, reduceAmount } from '../src.js';

const magicIntegerSmall = 10000;
const magicIntegerBig = 1000000000000000000000000000000;

const magicFloatSmall = 100.01;
const magicFloatBig = 1000000000000000000000000000000.00000000001;

const arbitraryExpectedAmount = '123400000000000000';
const arbitraryDeltaAmount = '100000000000000000';

const arbitraryExpectedAmountMinusDelta = '23400000000000000';
const arbitraryExpectedAmountPlusDelta = '223400000000000000';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Amount', () => {
  describe('isValidAmount', () => {
    it('can valid amount as small integer', () => {
      // 'integer should be valid'
      expect(isValidAmount(magicIntegerSmall)).toBe(true);
    });
    it('cannot valid amount as big integer', () => {
      // 'Big integer should not be valid'
      expect(isValidAmount(magicIntegerBig)).toBe(false);
    });
    it('cannot valid amount as bn', () => {
      // 'BN should not be valid'
      expect(isValidAmount(BigNumber.from('1000000000000000000000000'))).toBe(false);
    });
    it('can valid amount as string representing integer', () => {
      // 'integer as string should be valid'
      expect(isValidAmount('10000')).toBe(true);
    });
    it('cannot valid amount as a small decimal', () => {
      // 'decimal should not be valid'
      expect(isValidAmount(magicFloatSmall)).toBe(false);
    });
    it('cannot valid amount as a big decimal', () => {
      // 'decimal should not be valid'
      expect(isValidAmount(magicFloatBig)).toBe(false);
    });
    it('cannot valid amount as string representing small decimal', () => {
      // 'decimal as string should not be valid'
      expect(isValidAmount('10000.01')).toBe(false);
    });
    it('cannot valid amount as string representing big decimal', () => {
      // 'decimal as string should not be valid'
      expect(isValidAmount('1000000000000000000000000000000000.01')).toBe(false);
    });
    it('cannot valid amount as not number', () => {
      // 'Not number should not be valid'
      expect(isValidAmount('Not a number')).toBe(false);
    });
    it('cannot valid amount as small integer', () => {
      // 'integer should not be valid'
      expect(isValidAmount(-magicIntegerSmall)).toBe(false);
    });
    it('cannot valid amount as big integer negative', () => {
      // 'Big integer should not be valid'
      expect(isValidAmount(-magicIntegerBig)).toBe(false);
    });
    it('cannot valid an empty string', () => {
      // 'Empty string should not be valid'
      expect(isValidAmount('')).toBe(false);
    });
  });

  describe('add', () => {
    it('cannot add amounts not number', () => {
      expect(() => addAmount('Not a number', '1000000000000000000')).toThrowError(
        'amount must represent a positive integer',
      );

      expect(() => addAmount('1000000000000000000', 'Not a number')).toThrowError(
        'delta must represent a positive integer',
      );
    });
    it('can add two amounts', () => {
      // 'add() result is wrong'
      expect(addAmount(arbitraryExpectedAmount, arbitraryDeltaAmount)).toBe(
        arbitraryExpectedAmountPlusDelta,
      );
    });
  });

  describe('reduce', () => {
    it('cannot reduce amounts not number', () => {
      expect(() => reduceAmount('Not a number', '1000000000000000000')).toThrowError(
        'amount must represent a positive integer',
      );

      expect(() => reduceAmount('1000000000000000000', 'Not a number')).toThrowError(
        'delta must represent a positive integer',
      );
    });
    it('can reduce two amounts', () => {
      // 'reduce() result is wrong'
      expect(reduceAmount(arbitraryExpectedAmount, arbitraryDeltaAmount)).toBe(
        arbitraryExpectedAmountMinusDelta,
      );
    });
    it('cannot reduce lower zero', () => {
      expect(() => reduceAmount(arbitraryDeltaAmount, arbitraryExpectedAmount)).toThrowError(
        'result of reduce is not valid',
      );
    });
  });
});
