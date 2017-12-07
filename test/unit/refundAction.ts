import {expect} from 'chai';
import BigNumber from 'bignumber.js';
import 'mocha';
import * as utils from '../utils';

var Web3 = require('web3');

import RequestNetwork from '../../src/requestNetwork';
import Artifacts from '../../src/artifacts';
const addressRequestEthereum = Artifacts.RequestEthereumArtifact.networks.private.address;
const addressSynchroneExtensionEscrow = Artifacts.RequestSynchroneExtensionEscrowArtifact.networks.private.address;

var rn;
var web3;
var defaultAccount;
var payer;
var payee;
var otherGuy;

var coreVersion;
var currentNumRequest;

var requestId;

describe('refundAction', () => {
    var arbitraryAmount = 100000000;
    rn = new RequestNetwork();
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async() => {
        var accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        coreVersion = await rn.requestCoreService.getVersionAsync();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequestAsync();

        let req = await rn.requestEthereumService.createRequestAsPayee( 
            payer,
            arbitraryAmount,
            '',
            '', 
            [],
            {from: payee});

        requestId = req.request.requestId;
    })

    it('payBack request', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer});

        let result = await rn.requestEthereumService.refundAction(
                            requestId,
                            arbitraryAmount,
                            {from: payee})
            .on('broadcasted', (data:any) => {
                expect(data, 'data.transactionHash is wrong').to.have.property('transactionHash');
            });

        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance,0,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

    it('payBack request not fully', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer});

        let result = await rn.requestEthereumService.refundAction(
                            requestId,
                            10,
                            {from: payee})
            .on('broadcasted', (data:any) => {
                expect(data, 'data.transactionHash is wrong').to.have.property('transactionHash');
            });

        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance,arbitraryAmount-10,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });
    it('payback request with not valid requestId', async () => {
        let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payee});

        try {
            let result = await rn.requestEthereumService.refundAction(
                                '0x00000000000000',
                                arbitraryAmount,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),'exception not right');
        }
    });

    it('payback request with not valid amount', async () => {
        let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer});

        try {
            let result = await rn.requestEthereumService.refundAction(
                                requestId,
                                -1,
                                {from: payee});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('_amount must a positive integer'),'exception not right');
        }
    });

    it('payback request by payer', async () => {
        let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer});

        try {
            let result = await rn.requestEthereumService.refundAction(
                                requestId,
                                arbitraryAmount,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('account must be payee'),'exception not right');
        }
    });

    it('payback request by otherGuy', async () => {
        let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer});

        try {
            let result = await rn.requestEthereumService.refundAction(
                                requestId,
                                arbitraryAmount,
                                {from: otherGuy});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('account must be payee'),'exception not right');
        }
    });


    it('payback request by otherGuy', async () => {
        let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                            requestId,
                            10,
                            0,
                            {from: payer});

        try {
            let result = await rn.requestEthereumService.refundAction(
                                requestId,
                                11,
                                {from: otherGuy});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('You cannot payback more than what has been paid'),'exception not right');
        }
    });

});
