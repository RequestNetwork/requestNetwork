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

describe('bitcoin NodesValidation cancel', () => {
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
                    [payee],
                    [arbitraryAmount],
                    payer,
                    [payeePaymentNoTxs],
                    [payeeRefundNoTxs]);

        requestId = req.request.requestId;
    });

    it('cancel request with not valid requestId', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.cancel(
                                '0x00000000000000',
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'),'exception not right');
        }
    });

    it('cancel request by payer when created', async () => {
        const result = await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(2);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('cancel request by otherGuy', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: randomAddress});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be the payer or the payee'),'exception not right');
        }
    })

    it('cancel request by payer when not created', async () => {
        await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('payer can cancel request in state \'created\''),'exception not right');
        }
    })

    it('cancel request by payee when cancel', async () => {
        await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('payee cannot cancel request already canceled'),'exception not right');
        }
    })

    it('cancel request by payee when created', async () => {
        const result = await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: payee});

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(2);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('cancel request by payee when accepted and balance == 0', async () => {
        await rn.requestBitcoinNodesValidationService.accept(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        const result = await rn.requestBitcoinNodesValidationService.cancel(
                                requestId,
                                {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(2);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });


    it('cancel request by payee when balance != 0', async () => {
        const req = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePayment,payee2Payment,payee3Payment],
                    [payeeRefund,payee2Refund,payee3Refund]);

        try {
            const result = await rn.requestBitcoinNodesValidationService.cancel(
                                req.request.requestId,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('impossible to cancel a Request with a balance !== 0'),'exception not right');
        }
    });
});
