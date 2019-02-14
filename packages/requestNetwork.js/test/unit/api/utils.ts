import { utils } from '../../../src/index';
const Web3 = require('web3');
const BigNumber = require('bn.js');

const chai = require('chai');
const assert = chai.assert;

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

describe('Request Network API', () => {
    let accounts: Array<string>;
    let examplePayees: Array<any>;
    let examplePayer: any;
    let exampleBadPayees1: Array<any>;
    let exampleBadPayees2: Array<any>;
    let exampleBadPayees3: Array<any>;
    let exampleBadPayer1: any;
    let exampleBadPayer2: any;
    let exampleBadPayer3: any;

    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();

        examplePayees = [{
            idAddress: accounts[0],
            paymentAddress: accounts[0],
            additional: 5,
            expectedAmount: 100,
        }];
        examplePayer = {
            idAddress: accounts[1],
            refundAddress: accounts[1],
        };

        exampleBadPayees1 = [{
            idAddress: 10,
            paymentAddress: accounts[0],
            additional: 5,
            expectedAmount: 100,
        }];
        exampleBadPayees2 = [{
            idAddress: accounts[0],
            paymentAddress: accounts[0],
        }];
        exampleBadPayees3 = [{
            idAddress: accounts[0],
            paymentAddress: accounts[0],
            expectedAmount: -100,
        }];

        exampleBadPayer1 = {
            idAddress: 5,
            refundAddress: accounts[1],
        };
        exampleBadPayer2 = {
            idAddress: accounts[0],
            refundAddress: 10,
        };
        exampleBadPayer3 = {
            refundAddress: accounts[1],
        };
    });

    describe('checks isAmount', () => {
        it('checks isAmount with correct values', () => {
            assert.isOk(utils.isPositiveAmount(10000));
            assert.isOk(utils.isPositiveAmount(new BigNumber(20000)));
            assert.isOk(utils.isPositiveAmount('15000'));
        });

        it('checks isAmount with invalid values', () => {
            assert.isNotOk(utils.isPositiveAmount(-10000));
            assert.isNotOk(utils.isPositiveAmount(new BigNumber(-5000)));
            assert.isNotOk(utils.isPositiveAmount('-10005'));
            assert.isNotOk(utils.isPositiveAmount('test'));
            assert.isNotOk(utils.isPositiveAmount(undefined));
            assert.isNotOk(utils.isPositiveAmount([]));
        });
    });

    describe('checks isAmountArray', () => {
        it('checks isAmountArray with correct values', () => {
            assert.isOk(utils.isArrayOfPositiveAmounts([10000, 2000, 5000]));
            assert.isOk(utils.isArrayOfPositiveAmounts([new BigNumber(0), new BigNumber(5000)]));
            assert.isOk(utils.isArrayOfPositiveAmounts(['15000', '2948']));
            assert.isOk(utils.isArrayOfPositiveAmounts([1000, '2948', new BigNumber(5000)]));
        });

        it('checks isAmount with invalid values', () => {
            assert.isNotOk(utils.isArrayOfPositiveAmounts([10000, -2000, 5000]));
            assert.isNotOk(utils.isArrayOfPositiveAmounts(['10000', 'test', '5000']));
            assert.isNotOk(utils.isArrayOfPositiveAmounts(['10000', '10', undefined]));
        });
    });

    describe('checks isPayeeInfo', () => {
        it('check isPayeeInfo with correct value', () => {
            assert.isOk(utils.isPayeeInfo(examplePayees[0]));
        });

        it('check isPayeeInfo with invalid value', () => {
            assert.isNotOk(utils.isPayeeInfo(exampleBadPayees1[0]));
        });
    });

    describe('checks isNonEmptyPayeeInfoArray', () => {
        it('check isNonEmptyPayeeInfoArray with correct values', () => {
            assert.isOk(utils.isArrayOfPayeeInfos(examplePayees));
        });

        it('check isNonEmptyPayeeInfoArray with invalid values', () => {
            assert.isNotOk(utils.isArrayOfPayeeInfos(exampleBadPayees1));
            assert.isNotOk(utils.isArrayOfPayeeInfos(exampleBadPayees2));
            assert.isNotOk(utils.isArrayOfPayeeInfos(exampleBadPayees3));
        });
    });

    describe('checks isPayerInfo', () => {
        it('check isPayerInfo with correct values', () => {
            assert.isOk(utils.isPayerInfo(examplePayer));
        });

        it('check isPayerInfo with invalid values', () => {
            assert.isNotOk(utils.isPayerInfo(exampleBadPayer1));
            assert.isNotOk(utils.isPayerInfo(exampleBadPayer2));
            assert.isNotOk(utils.isPayerInfo(exampleBadPayer3));
        });
    });
});
