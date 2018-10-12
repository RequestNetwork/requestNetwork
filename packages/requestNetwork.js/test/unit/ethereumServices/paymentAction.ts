import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import * as utils from '../../utils';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

const addressRequestEthereum = requestArtifacts('private', 'last-RequestEthereum').networks.private.address;
const addressRequestCore = requestArtifacts('private', 'last-RequestCore').networks.private.address;

let rn: any;
let web3: any;
let defaultAccount: string;
let payer: string;
let payee: string;
let payee2: string;
let payee3: string;
let payeePaymentAddress: string;
let otherGuy: string;
let payerRefundAddress: string;
let currentNumRequest: any;

let requestId: any;

describe('paymentAction', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 200000;
    const arbitraryAmount3 = 30000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        otherGuy = accounts[9].toLowerCase();
        
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        const req = await rn.requestEthereumService.createRequestAsPayee(
            [payee],
            [arbitraryAmount],
            payer,
            [payeePaymentAddress],
            payerRefundAddress,
            undefined,
            undefined,
            undefined,
            {from: payee});

        requestId = req.request.requestId;
    })

    it('pay accepted request', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestEthereumService.paymentAction(
                            requestId,
                            [arbitraryAmount],
                            undefined,
                            {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay created request', async () => {
        const result = await rn.requestEthereumService.paymentAction(
                            requestId,
                            [arbitraryAmount],
                            undefined,
                            {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with additional', async () => {
        const result = await rn.requestEthereumService.paymentAction(
                            requestId,
                            [arbitraryAmount],
                            [arbitraryAmount3],
                            {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+arbitraryAmount3, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with not valid requestId', async () => {

        try {
            const result = await rn.requestEthereumService.paymentAction(
                                '0x00000000000000',
                                [arbitraryAmount],
                                [0],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'),'exception not right');
        }
    });

    it('pay request with not valid additional', async () => {
        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                [-1],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_additions must be positive integers'),'exception not right');
        }
    });

    it('pay request with not valid amount', async () => {
        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                [-1],
                                [arbitraryAmount],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_amountsToPay must be positive integers'),'exception not right');
        }
    });

    it('pay request canceled', async () => {
        const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                [0],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('request cannot be canceled'),'exception not right');
        }
    });

    it('pay request created by other guy no additions', async () => {
        const result = await rn.requestEthereumService.paymentAction(
                            requestId,
                            [arbitraryAmount],
                            undefined,
                            {from: otherGuy})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request created by other guy WITH additions', async () => {
        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                [1],
                                {from: otherGuy});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('only payer can add additions'),'exception not right');
        }
    });

    it('pay request without options', async () => {
        const req2 = await rn.requestEthereumService.createRequestAsPayee(
            [payee],
            [arbitraryAmount],
            defaultAccount,
            [payeePaymentAddress],
            payerRefundAddress,
            undefined,
            undefined,
            undefined,
            {from: payee});
        ++currentNumRequest;

        requestId = req2.request.requestId;

        const result = await rn.requestEthereumService.paymentAction(
                            requestId,
                            [arbitraryAmount])
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });
});
