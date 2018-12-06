import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import Amount from '../../src/amount';
import * as TestData from './utils/test-data-generator';

const magicIntegerSmall = 10000;
const magicIntegerBig = 1000000000000000000000000000000;

const magicFloatSmall = 100.01;
const magicFloatBig = 1000000000000000000000000000000.00000000001;

/* tslint:disable:no-unused-expression */
describe('Amount', () => {
  describe('isValid', () => {
    it('can valid amount as small integer', () => {
      expect(Amount.isValid(magicIntegerSmall), 'integer should be valid').to.be.true;
    });
    it('cannot valid amount as big integer', () => {
      expect(Amount.isValid(magicIntegerBig), 'Big integer should not be valid').to.be.false;
    });
    it('can valid amount as bn', () => {
      expect(Amount.isValid(new bigNumber('1000000000000000000000000')), 'BN should be valid').to.be
        .true;
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
      try {
        Amount.add('Not a number', '1000000000000000000');
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal(
          'amount must represent a positive integer',
        );
      }
      try {
        Amount.add('1000000000000000000', 'Not a number');
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal(
          'delta must represent a positive integer',
        );
      }
    });
    it('can add two amounts', () => {
      expect(
        Amount.add(TestData.arbitraryExpectedAmount, TestData.arbitraryDeltaAmount),
        'add() result is wrong',
      ).to.equal(TestData.arbitraryExpectedAmountPlusDelta);
    });
  });

  describe('reduce', () => {
    it('cannot reduce amounts not number', () => {
      try {
        Amount.reduce('Not a number', '1000000000000000000');
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal(
          'amount must represent a positive integer',
        );
      }
      try {
        Amount.reduce('1000000000000000000', 'Not a number');
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal(
          'delta must represent a positive integer',
        );
      }
    });
    it('can reduce two amounts', () => {
      expect(
        Amount.reduce(TestData.arbitraryExpectedAmount, TestData.arbitraryDeltaAmount),
        'reduce() result is wrong',
      ).to.equal(TestData.arbitraryExpectedAmountMinusDelta);
    });
    it('cannot reduce lower zero', () => {
      try {
        Amount.reduce(TestData.arbitraryDeltaAmount, TestData.arbitraryExpectedAmount);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal('result of reduce is not valid');
      }
    });
  });
});
