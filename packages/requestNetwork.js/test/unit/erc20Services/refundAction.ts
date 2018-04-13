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
let payeeWithoutToken: any;

let requestId: any;

describe('erc20 refundAction', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 2000000;
    const arbitraryAmount3 = 300000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service(ADDRESS_TOKEN_TEST);
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payeeWithoutToken = accounts[1].toLowerCase();
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
            [payeePaymentAddress,undefined,payee3PaymentAddress],
            payerRefundAddress,
            undefined,
            undefined,
            undefined,
            {from: payee});

        requestId = req.request.requestId;
    });

    it('payBack created request', async () => {
        // approve
        await testToken.transfer(payee, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payee})

        const result = await rn.requestERC20Service.refundAction(
                            requestId,
                            arbitraryAmount,
                            {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, -arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');
    });

    it('payBack accepted request', async () => {
        // approve
        await testToken.transfer(payee, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payee})

        await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestERC20Service.refundAction(
                            requestId,
                            arbitraryAmount,
                            {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, -arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');
    });

    it('payBack request by payee2', async () => {
        // approve
        await testToken.transfer(payee2, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payee2})

        const result = await rn.requestERC20Service.refundAction(
                            requestId,
                            arbitraryAmount,
                            {from: payee2})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, -arbitraryAmount, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');
    });

    it('payBack request by payee3paymentAddress', async () => {
        // approve
        await testToken.transfer(payee3PaymentAddress, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payee3PaymentAddress})

        const result = await rn.requestERC20Service.refundAction(
                            requestId,
                            arbitraryAmount,
                            {from: payee3PaymentAddress})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, -arbitraryAmount, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');
    });

    it('payBack created request by payeePaymentAddress', async () => {
        // approve
        await testToken.transfer(payeePaymentAddress, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payeePaymentAddress})

        const result = await rn.requestERC20Service.refundAction(
                            requestId,
                            arbitraryAmount,
                            {from: payeePaymentAddress})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, -arbitraryAmount, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');
    });

    it('payback request with not valid requestId', async () => {
        // approve
        await testToken.transfer(payee, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payee})

        try {
            const result = await rn.requestERC20Service.refundAction(
                                '0x00000000000000',
                                arbitraryAmount,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'), 'exception not right');
        }
    });

    it('payback request with not valid amount', async () => {
        try {
            const result = await rn.requestERC20Service.refundAction(
                                requestId,
                                -1,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_amountToRefund must a positive integer'), 'exception not right');
        }
    });

    it('payback request by payer', async () => {
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payer})

        try {
            const result = await rn.requestERC20Service.refundAction(
                                requestId,
                                arbitraryAmount,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be a payee'), 'exception not right');
        }
    });

    it('payback request by otherGuy', async () => {
        // approve
        await testToken.transfer(otherGuy, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: otherGuy})

        try {
            const result = await rn.requestERC20Service.refundAction(
                                requestId,
                                arbitraryAmount,
                                {from: otherGuy});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be a payee'), 'exception not right');
        }
    });





    it('refund created request with not enough token', async () => {
        // approve but balance too low
        await testToken.transfer(defaultAccount, await testToken.balanceOf(payeeWithoutToken), {from: payeeWithoutToken});
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payeeWithoutToken})

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payeeWithoutToken})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('balance of token is too low'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payeeWithoutToken})
    });



    it('refund created request with token allowance too low', async () => {
        // approve but balance ok but allowance too low
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payeeWithoutToken})
        await testToken.transfer(payeeWithoutToken, arbitraryAmount, {from: defaultAccount});   

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payeeWithoutToken})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('allowance of token is too low'),'exception not right');
        }
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payeeWithoutToken});
    });


    it('refund created request with not enough token but skipERC20checkAllowance', async () => {
        // approve but balance too low
        await testToken.transfer(defaultAccount, await testToken.balanceOf(payeeWithoutToken), {from: payeeWithoutToken});
        await rn.requestERC20Service.approveTokenForRequest(requestId, arbitraryAmount, {from: payeeWithoutToken})

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payeeWithoutToken, skipERC20checkAllowance:true})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('Returned error: VM Exception while processing transaction: revert'),'exception not right');
        }
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payeeWithoutToken})
    });



    it('refund created request with token allowance too low', async () => {
        // approve but balance ok but allowance too low
        await rn.requestERC20Service.approveTokenForRequest(requestId, 0, {from: payeeWithoutToken})
        await testToken.transfer(payeeWithoutToken, arbitraryAmount, {from: defaultAccount});   

        try {
            const result = await rn.requestERC20Service.paymentAction(
                                requestId,
                                [arbitraryAmount],
                                undefined,
                                {from: payeeWithoutToken, skipERC20checkAllowance:true})
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('Returned error: VM Exception while processing transaction: revert'),'exception not right');
        }
        await testToken.transfer(defaultAccount, arbitraryAmount, {from: payeeWithoutToken});
    });
});
