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
let payerRefundAddress: string;
let otherGuy: string;

let coreVersion: any;
let currentNumRequest: any;

let requestId: any;

describe('erc20 accept', () => {
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
        otherGuy = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        const req = await rn.requestERC20Service.createRequestAsPayee(
            addressTestToken,
            [payee],
            [arbitraryAmount],
            payer,
            [payeePaymentAddress],
            payerRefundAddress,
            '',
            '',
            [],
            {from: payee});

        requestId = req.request.requestId;
    });

    it('accept request with not valid requestId', async () => {
        try {
            const result = await rn.requestERC20Service.accept(
                                '0x00000000000000',
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'),'exception not right');
        }
    });

    it('accept request', async () => {
        const result = await rn.requestERC20Service.accept(
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
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('accept request by payee or otherguy', async () => {
        try {
            const result = await rn.requestERC20Service.accept(
                                requestId,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be the payer'),'exception not right');
        }

        try {
            const result = await rn.requestERC20Service.accept(
                                requestId,
                                {from: otherGuy});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be the payer'),'exception not right');
        }
    });

    it('accept request not in created state', async () => {
        try {
            // accept first
            await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer});

            const result = await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('request state is not \'created\''),'exception not right');
        }
    });

});
