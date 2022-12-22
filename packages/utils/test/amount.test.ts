import { BigNumber } from 'ethers';

import { add, isValid, reduce } from '../src';

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
  describe('isValid', () => {
    it('can valid amount as small integer', () => {
      // 'integer should be valid'
      expect(isValid(magicIntegerSmall)).toBe(true);
    });
    it('cannot valid amount as big integer', () => {
      // 'Big integer should not be valid'
      expect(isValid(magicIntegerBig)).toBe(false);
    });
    it('cannot valid amount as bn', () => {
      // 'BN should not be valid'
      expect(isValid(BigNumber.from('1000000000000000000000000'))).toBe(false);
    });
    it('can valid amount as string representing integer', () => {
      // 'integer as string should be valid'
      expect(isValid('10000')).toBe(true);
    });
    it('cannot valid amount as a small decimal', () => {
      // 'decimal should not be valid'
      expect(isValid(magicFloatSmall)).toBe(false);
    });
    it('cannot valid amount as a big decimal', () => {
      // 'decimal should not be valid'
      expect(isValid(magicFloatBig)).toBe(false);
    });
    it('cannot valid amount as string representing small decimal', () => {
      // 'decimal as string should not be valid'
      expect(isValid('10000.01')).toBe(false);
    });
    it('cannot valid amount as string representing big decimal', () => {
      // 'decimal as string should not be valid'
      expect(isValid('1000000000000000000000000000000000.01')).toBe(false);
    });
    it('cannot valid amount as not number', () => {
      // 'Not number should not be valid'
      expect(isValid('Not a number')).toBe(false);
    });
    it('cannot valid amount as small integer', () => {
      // 'integer should not be valid'
      expect(isValid(-magicIntegerSmall)).toBe(false);
    });
    it('cannot valid amount as big integer negative', () => {
      // 'Big integer should not be valid'
      expect(isValid(-magicIntegerBig)).toBe(false);
    });
    it('cannot valid an empty string', () => {
      // 'Empty string should not be valid'
      expect(isValid('')).toBe(false);
    });
  });

  describe('add', () => {
    it('cannot add amounts not number', () => {
      expect(() => add('Not a number', '1000000000000000000')).toThrowError(
        'amount must represent a positive integer',
      );

      expect(() => add('1000000000000000000', 'Not a number')).toThrowError(
        'delta must represent a positive integer',
      );
    });
    it('can add two amounts', () => {
      // 'add() result is wrong'
      expect(add(arbitraryExpectedAmount, arbitraryDeltaAmount)).toBe(
        arbitraryExpectedAmountPlusDelta,
      );
    });
  });

  describe('reduce', () => {
    it('cannot reduce amounts not number', () => {
      expect(() => reduce('Not a number', '1000000000000000000')).toThrowError(
        'amount must represent a positive integer',
      );

      expect(() => reduce('1000000000000000000', 'Not a number')).toThrowError(
        'delta must represent a positive integer',
      );
    });
    it('can reduce two amounts', () => {
      // 'reduce() result is wrong'
      expect(reduce(arbitraryExpectedAmount, arbitraryDeltaAmount)).toBe(
        arbitraryExpectedAmountMinusDelta,
      );
    });
    it('cannot reduce lower zero', () => {
      expect(() => reduce(arbitraryDeltaAmount, arbitraryExpectedAmount)).toThrowError(
        'result of reduce is not valid',
      );
    });
  });
});
