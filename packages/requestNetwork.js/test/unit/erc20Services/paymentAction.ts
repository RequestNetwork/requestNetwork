import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

const ADDRESS_TOKEN_TEST = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
const addressRequestERC20 = requestArtifacts('private', 'last-RequestErc20-'+ADDRESS_TOKEN_TEST).networks.private.address;
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
let otherGuy: string;
let payerRefundAddress: string;
let currentNumRequest: any;
let payerWithoutToken: any;

let requestId: any;

describe('erc20 paymentAction', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 200000;
    const arbitraryAmount3 = 30000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service('0x345cA3e014Aaf5dcA488057592ee47305D9B3e10');
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payerWithoutToken = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payee3PaymentAddress = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        otherGuy = accounts[9].toLowerCase();

        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        const req = await rn.requestERC20Service.createRequestAsPayee(
            ADDRESS_TOKEN_TEST,
            [payee, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            payer,
            [payeePaymentAddress],
            payerRefundAddress,
            undefined,
            undefined,
            undefined,
            {from: payee});

        requestId = req.request.requestId;
    });

    it('pay accepted request', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestERC20Service.paymentAction(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
        
    });

    it('pay created request', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        const result = await rn.requestERC20Service.paymentAction(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with additional', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        const result = await rn.requestERC20Service.paymentAction(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });


    it('pay request with not valid requestId', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                '0x00000000000000',
                                [arbitraryAmount],
                                undefined,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'),'exception not right');
        }
    });

    it('pay request with not valid additional', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                [-1],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_additionals must be positives integer'),'exception not right');
        }
    });

    it('pay request with not valid amount', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [-1],
                                [arbitraryAmount],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_amountsToPay must be positives integer'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payer})
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payer});
    });

    it('pay request canceled', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        const result = await rn.requestERC20Service.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                [0],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('request cannot be canceled'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payer})
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payer});
    });

    it('pay request created by other guy no additionals', async () => {
        // approve
        await testToken.transfer(otherGuy, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: otherGuy})

        const result = await rn.requestERC20Service.paymentAction(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request created by other guy WITH additionals', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                [1],
                                {from: otherGuy});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('only payer can add additionals'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payer})
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payer});
    });


    it('pay created request with not enough token', async () => {
        // approve but balance too low
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payerWithoutToken})
        await testToken.transfer(defaultAccount, await testToken.balanceOf(payerWithoutToken), {from: payerWithoutToken});

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payerWithoutToken})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('balance of token is too low'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payerWithoutToken})
    });

    it('pay created request with token allowance too low', async () => {
        // approve but balance ok but allowance too low
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payerWithoutToken})
        await testToken.transfer(payerWithoutToken, arbitraryAmount, {from: defaultAccount});   

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payerWithoutToken})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('allowance of token is too low'),'exception not right');
        }
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payer});
    });


    it('pay created request with token allowance too low but skipERC20checkAllowance', async () => {
        // approve but balance ok but allowance too low
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payerWithoutToken})
        await testToken.transfer(payerWithoutToken, arbitraryAmount, {from: defaultAccount});   

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payerWithoutToken, skipERC20checkAllowance:true})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('Returned error: VM Exception while processing transaction: revert'),'exception not right');
        }
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payer});
    });

    it('pay created request with not enough token but skipERC20checkAllowance', async () => {
        // approve but balance too low
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payerWithoutToken})
        await testToken.transfer(defaultAccount, await testToken.balanceOf(payerWithoutToken), {from: payerWithoutToken});

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payerWithoutToken, skipERC20checkAllowance:true})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('Returned error: VM Exception while processing transaction: revert'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payerWithoutToken})
    });
});
