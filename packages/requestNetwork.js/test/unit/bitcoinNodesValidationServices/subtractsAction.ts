import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';
import BitcoinServiceTest from './bitcoin-service-test';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;
const addressRequestBitcoinNodesValidation = requestArtifacts('private', 'last-RequestBitcoinNodesValidation').networks.private.address;
const addressRequestCore = requestArtifacts('private', 'last-RequestCore').networks.private.address;

let rn: any;
let web3: any;
let defaultAccount: string;
let payer: string;
let payee: string;
let payee2: string;
let payee3: string;
let payeePaymentNoTxsAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;
let randomAddress: string;
let currentNumRequest: any;
let requestId: string;

var payeePaymentNoTxs = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';
var payeeRefundNoTxs = 'mx7AkR2D45VqsjREqEXot8wMjcRMCyQvwS';

var payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
var payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
var payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

var payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
var payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
var payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

describe('bitcoin NodesValidation subtract', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 2000000;
    const arbitraryAmount3 = 300000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestBitcoinNodesValidationService.web3Single.web3;
    BitcoinServiceTest.init();
    rn.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        payee = accounts[0].toLowerCase();
        randomAddress = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentNoTxsAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 

        const req = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee, payee2, payee3],
                    [arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
                    payer,
                    [payeePayment, payee2Payment, payee3Payment],
                    [payeeRefund, payee2Refund, payee3Refund]);

        requestId = req.request.requestId;
    });

    it('subtracts request', async () => {
        const result = await rn.requestERC20Service.subtractAction(
                            requestId,
                            [1, 2, 3],
                            {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount - 1, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, '-99999', 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2-2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, '44444', 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3-3, 'payee3 expectedAmount is wrong');
    });


    it('subtracts accepted request', async () => {
        await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestERC20Service.subtractAction(
                            requestId,
                            [1, 2, 3],
                            {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount - 1, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, '-99999', 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2 - 2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, '44444', 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3 - 3, 'payee3 expectedAmount is wrong');
    });

    it('pay request with not valid requestId', async () => {

        try {
            const result = await rn.requestERC20Service.subtractAction(
                                '0x00000000000000',
                                [arbitraryAmount],
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'), 'exception not right');
        }
    });

    it('pay request with not valid additional (negative)', async () => {

        try {
            const result = await rn.requestERC20Service.subtractAction(
                                requestId,
                                [-1],
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('subtracts must be positives integer'), 'exception not right');
        }
    });

    it('pay request with not valid additional (too high)', async () => {

        try {
            const result = await rn.requestERC20Service.subtractAction(
                                requestId,
                                [arbitraryAmount + 1],
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('subtracts must be lower than amountExpected\'s'), 'exception not right');
        }
    });

    it('subtracts request canceled', async () => {
        const req = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee],
                    [arbitraryAmount],
                    payer,
                    [payeePaymentNoTxs],
                    [payeeRefundNoTxs]);

        await rn.requestERC20Service.cancel(
                                req.request.requestId,
                                {from: payer});

        try {
            const result = await rn.requestERC20Service.subtractAction(
                                req.request.requestId,
                                [arbitraryAmount],
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('request must be accepted or created'), 'exception not right');
        }
    });

    it('subtracts request from otherGuy', async () => {
        try {
            const result = await rn.requestERC20Service.subtractAction(
                                requestId,
                                [arbitraryAmount],
                                {from: randomAddress});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be payee'), 'exception not right');
        }
    });


    it('subtracts too long', async () => {
        try {
            const result = await rn.requestERC20Service.subtractAction(
                                requestId,
                                [3, 2, 1, 1],
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_subtracts cannot be bigger than _payeesIdAddress'), 'exception not right');
        }
    });
});
