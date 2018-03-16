import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

const addressRequestERC20 = requestArtifacts('private', 'last-RequestErc20').networks.private.address;
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

let requestId: any;

describe('erc20 subtracts Action', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 2000000;
    const arbitraryAmount3 = 300000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service('0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF');
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
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
            addressTestToken,
            [payee, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            payer,
            [payeePaymentAddress],
            payerRefundAddress,
            '',
            '',
            [],
            {from: payee});

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
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2-2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
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
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');
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
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2 - 2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
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
        await rn.requestERC20Service.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestERC20Service.subtractAction(
                                requestId,
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
                                {from: otherGuy});
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
