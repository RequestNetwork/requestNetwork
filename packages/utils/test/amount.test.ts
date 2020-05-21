import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import Amount from '../src/amount';

const magicIntegerSmall = 10000;
const magicIntegerBig = 1000000000000000000000000000000;

const magicFloatSmall = 100.01;
const magicFloatBig = 1000000000000000000000000000000.00000000001;

const arbitraryExpectedAmount = '123400000000000000';
const arbitraryDeltaAmount = '100000000000000000';

const arbitraryExpectedAmountMinusDelta = '23400000000000000';
const arbitraryExpectedAmountPlusDelta = '223400000000000000';

/* tslint:disable:no-unused-expression */
describe('Amount', () => {
  describe('isValid', () => {
    it('can valid amount as small integer', () => {
      expect(Amount.isValid(magicIntegerSmall), 'integer should be valid').to.be.true;
    });
    it('cannot valid amount as big integer', () => {
      expect(Amount.isValid(magicIntegerBig), 'Big integer should not be valid').to.be.false;
    });
    it('cannot valid amount as bn', () => {
      expect(Amount.isValid(new bigNumber('1000000000000000000000000')), 'BN should not be valid')
        .to.be.false;
    });
    it('can valid amount as string representing integer', () => {
      expect(Amount.isValid('10000'), 'integer as string should be valid').to.be.true;
    });
    it('cannot valid amount as a small decimal', () => {
      expect(Amount.isValid(magicFloatSmall), 'decimal should not be valid').to.be.false;
    });
    it('cannot valid amount as a big decimal', () => {
      expect(Amount.isValid(magicFloatBig), 'decimal should not be valid').to.be.false;
    });
    it('cannot valid amount as string representing small decimal', () => {
      expect(Amount.isValid('10000.01'), 'decimal as string should not be valid').to.be.false;
    });
    it('cannot valid amount as string representing big decimal', () => {
      expect(
        Amount.isValid('1000000000000000000000000000000000.01'),
        'decimal as string should not be valid',
      ).to.be.false;
    });
    it('cannot valid amount as not number', () => {
      expect(Amount.isValid('Not a number'), 'Not number should not be valid').to.be.false;
    });
    it('cannot valid amount as small integer', () => {
      expect(Amount.isValid(-magicIntegerSmall), 'integer should not be valid').to.be.false;
    });
    it('cannot valid amount as big integer negative', () => {
      expect(Amount.isValid(-magicIntegerBig), 'Big integer should not be valid').to.be.false;
    });
    it('cannot valid an empty string', () => {
      expect(Amount.isValid(''), 'Empty string should not be valid').to.be.false;
    });
  });

  describe('add', () => {
    it('cannot add amounts not number', () => {
      expect(() => Amount.add('Not a number', '1000000000000000000')).to.throw(
        'amount must represent a positive integer',
      );

      expect(() => Amount.add('1000000000000000000', 'Not a number')).to.throw(
        'delta must represent a positive integer',
      );
    });
    it('can add two amounts', () => {
      expect(
        Amount.add(arbitraryExpectedAmount, arbitraryDeltaAmount),
        'add() result is wrong',
      ).to.equal(arbitraryExpectedAmountPlusDelta);
    });
  });

  describe('reduce', () => {
    it('cannot reduce amounts not number', () => {
      expect(() => Amount.reduce('Not a number', '1000000000000000000')).to.throw(
        'amount must represent a positive integer',
      );

      expect(() => Amount.reduce('1000000000000000000', 'Not a number')).to.throw(
        'delta must represent a positive integer',
      );
    });
    it('can reduce two amounts', () => {
      expect(
        Amount.reduce(arbitraryExpectedAmount, arbitraryDeltaAmount),
        'reduce() result is wrong',
      ).to.equal(arbitraryExpectedAmountMinusDelta);
    });
    it('cannot reduce lower zero', () => {
      expect(() => Amount.reduce(arbitraryDeltaAmount, arbitraryExpectedAmount)).to.throw(
        'result of reduce is not valid',
      );
    });
  });
});
