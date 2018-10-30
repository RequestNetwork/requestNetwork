import {expect} from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import Amount from '../../src/utils/amount';

/* tslint:disable:no-unused-expression */
describe('Amount utils', () => {
    it('can valid amount as small integer', () => {
        expect(Amount.isValid(10000), 'integer should be valid').to.be.true;
    });
    it('cannot valid amount as big integer', () => {
        expect(Amount.isValid(1000000000000000000000000000000), 'Big integer should not be valid').to.be.false;
    });
    it('can valid amount as bn', () => {
        expect(Amount.isValid(new bigNumber('1000000000000000000000000')), 'BN should be valid').to.be.true;
    });
    it('can valid amount as string representing integer', () => {
        expect(Amount.isValid('10000'), 'integer as string should be valid').to.be.true;
    });
    it('cannot valid amount as a small decimal', () => {
        expect(Amount.isValid(100.001), 'decimal should not be valid').to.be.false;
    });
    it('cannot valid amount as a big decimal', () => {
        expect(Amount.isValid(100000000000000000000000000000000000.001), 'decimal should not be valid').to.be.false;
    });
    it('cannot valid amount as string representing small decimal', () => {
        expect(Amount.isValid('10000.01'), 'decimal as string should not be valid').to.be.false;
    });
    it('cannot valid amount as string representing big decimal', () => {
        expect(Amount.isValid('1000000000000000000000000000000000.01'), 'decimal as string should not be valid').to.be.false;
    });
    it('cannot valid amount as not number', () => {
        expect(Amount.isValid('Not a number'), 'Not number should not be valid').to.be.false;
    });
    it('cannot valid amount as small integer', () => {
        expect(Amount.isValid(-10000), 'integer should not be valid').to.be.false;
    });
    it('cannot valid amount as big integer negative', () => {
        expect(Amount.isValid(-1000000000000000000000000000000), 'Big integer should not be valid').to.be.false;
    });

    it('cannot valid an empty string', () => {
        expect(Amount.isValid(''), 'Empty string should not be valid').to.be.false;
    });
});
