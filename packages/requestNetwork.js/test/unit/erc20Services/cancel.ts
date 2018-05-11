    import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
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
let otherGuy: string;

let coreVersion: any;
let currentNumRequest: any;

let requestId: any;

describe('erc20 cancel', () => {
    const arbitraryAmount = 100000000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        const req = await rn.requestERC20Service.createRequestAsPayee(
            ADDRESS_TOKEN_TEST,
            [payee],
            [arbitraryAmount],
            payer,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            {from: payee});

        requestId = req.request.requestId;
    });

    it('cancel request with not valid requestId', async () => {
        try {
            const result = await rn.requestERC20Service.cancel(
                                '0x00000000000000',
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'),'exception not right');
        }
    });

    it('cancel request by payer when created', async () => {
        const result = await rn.requestERC20Service.cancel(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('cancel request by otherGuy', async () => {
        try {
            const result = await rn.requestERC20Service.cancel(
                                requestId,
                                {from: otherGuy});
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
            const result = await rn.requestERC20Service.cancel(
                                requestId,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('payer can cancel request in state \'created\''),'exception not right');
        }
    })

    it('cancel request by payee when cancel', async () => {
        await rn.requestERC20Service.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestERC20Service.cancel(
                                requestId,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('payee cannot cancel request already canceled'),'exception not right');
        }
    })

    it('cancel request by payee when created', async () => {
        const result = await rn.requestERC20Service.cancel(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('cancel request by payee when accepted and balance == 0', async () => {
        await rn.requestERC20Service.accept(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        const result = await rn.requestERC20Service.cancel(
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });


});
