import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import BitcoinServiceTest from './bitcoin-service-mock';
import * as utils from '../../utils';

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
let payeePaymentAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;
let randomAddress: string;
let currentNumRequest: any;

var payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
var payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
var payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

var payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
var payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
var payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

const arbitraryAmount = 100000000;
const arbitraryAmount2 = 20000000;
const arbitraryAmount3 =  3000000;

describe('bitcoinNodesValidation createRequestAsPayeeAction', () => {
    beforeEach(async () => {
        rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
        web3 = rn.requestBitcoinNodesValidationService.web3Single.web3;
        BitcoinServiceTest.init();
        rn.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();
    
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        randomAddress = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payer = accounts[7].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 
    });

    it('create request (implicit parameters)', async () => {
        const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePayment,payee2Payment,payee3Payment],
                    [payeeRefund,payee2Refund,payee3Refund])
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.transaction).to.have.property('hash');

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'payee balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());
        expect(result.request.data, 'request.data is wrong').to.be.undefined;

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, '-99999', 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, '44444', 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.equal(payeePayment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.equal(payee2Payment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.equal(payee3Payment);

        expect(result.request.currencyContract.payeeRefundAddress, 'payerRefundAddress is wrong').to.equal(payeeRefund);
        expect(result.request.currencyContract.subPayeesRefundAddress[0], 'subPayeesRefundAddress0 is wrong').to.equal(payee2Refund);
        expect(result.request.currencyContract.subPayeesRefundAddress[1], 'subPayeesRefundAddress1 is wrong').to.equal(payee3Refund);
    });

    it('create request', async () => {
        const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePayment,payee2Payment,payee3Payment],
                    [payeeRefund,payee2Refund,payee3Refund],
                    '{"reason":"weed purchased"}',
                    undefined,
                    undefined,
                    {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.transaction).to.have.property('hash');

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'payee balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, '-99999', 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, '44444', 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.equal(payeePayment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.equal(payee2Payment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.equal(payee3Payment);

        expect(result.request.currencyContract.payeeRefundAddress, 'payerRefundAddress is wrong').to.equal(payeeRefund);
        expect(result.request.currencyContract.subPayeesRefundAddress[0], 'subPayeesRefundAddress0 is wrong').to.equal(payee2Refund);
        expect(result.request.currencyContract.subPayeesRefundAddress[1], 'subPayeesRefundAddress1 is wrong').to.equal(payee3Refund);
    });

    it('create request _payees not address', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    ['0xNOTADDRESS'],
                    [arbitraryAmount],
                    payer,
                    [payeePayment],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress must be valid eth addresses'), 'exception not right');
        }
    });

    it('create request _payer not address', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [arbitraryAmount],
                    '0xNOTADDRESS',
                    [payeePayment],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payer must be a valid eth address'), 'exception not right');
        }
    });

    it('create request _payerRefundAddress not bitcoin address', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [arbitraryAmount],
                    payer,
                    [payeePayment],
                    ['NOTBITCOINADDRESS'])
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payerRefundAddress must be valid bitcoin addresses'), 'exception not right');
        }
    });

    it('create request _payeePaymentAddress not bitcoin address', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [arbitraryAmount],
                    payer,
                    ['NOTBITCOINADDRESS'],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesPaymentAddress must be valid bitcoin addresses'), 'exception not right');
        }
    });

    it('create request payer == payee', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [arbitraryAmount],
                    defaultAccount,
                    [payeePayment],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_from must be different than _payer'), 'exception not right');
        }
    });

    it('create request amount < 0', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [-1],
                    payer,
                    [payeePayment],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_expectedAmounts must be positive integers'), 'exception not right');
        }
    });


    it('create request with different array size', async () => {
        try { 
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount, payee2],
                    [arbitraryAmount],
                    payer,
                    [payeePayment],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress, _expectedAmounts, _payerRefundAddress and _payeesPaymentAddress must have the same size'),'exception not right');
        }
    });

    it('create request with different array size (bis)', async () => {
        try { 
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [arbitraryAmount],
                    payer,
                    [payeePayment, payee2Payment],
                    [payeeRefund])
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress, _expectedAmounts, _payerRefundAddress and _payeesPaymentAddress must have the same size'),'exception not right');
        }
    });

    it('create request with different array size (ter)', async () => {
        try { 
            const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount],
                    [arbitraryAmount],
                    payer,
                    [payeePayment],
                    [payeeRefund, payee2Refund])
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress, _expectedAmounts, _payerRefundAddress and _payeesPaymentAddress must have the same size'),'exception not right');
        }
    });

});

