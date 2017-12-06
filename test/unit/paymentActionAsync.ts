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

describe('paymentActionAsync', () => {
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

        let req = await rn.requestEthereumService.createRequestAsPayeeAsync( 
            payer,
            arbitraryAmount,
            '',
            '', 
            [],
            {from: payee});

        requestId = req.request.requestId;
    })

    it('pay request', async () => {
        await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        let result = await rn.requestEthereumService.paymentActionAsync(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer});

        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance,arbitraryAmount,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

    it('pay request with additional', async () => {
        await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        let result = await rn.requestEthereumService.paymentActionAsync(
                            requestId,
                            arbitraryAmount,
                            10,
                            {from: payer});
            
        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount+10,'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,arbitraryAmount,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

    it('pay request with not valid requestId', async () => {
        let result = await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        try {
            let result = await rn.requestEthereumService.paymentActionAsync(
                                '0x00000000000000',
                                arbitraryAmount,
                                0,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),'exception not right');
        }
    });

    it('pay request with not valid additional', async () => {
        let result = await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        try {
            let result = await rn.requestEthereumService.paymentActionAsync(
                                requestId,
                                arbitraryAmount,
                                -1,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('_additional must a positive integer'),'exception not right');
        }
    });

    it('pay request with not valid amount', async () => {
        let result = await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        try {
            let result = await rn.requestEthereumService.paymentActionAsync(
                                requestId,
                                -1,
                                0,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('_amount must a positive integer'),'exception not right');
        }
    });

    it('pay request canceled', async () => {
        let result = await rn.requestEthereumService.cancelAsync(
                                requestId,
                                {from: payer});

        try {
            let result = await rn.requestEthereumService.paymentActionAsync(
                                requestId,
                                arbitraryAmount,
                                0,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('request must be accepted'),'exception not right');
        }
    });

    it('pay request created', async () => {
        let result = await rn.requestEthereumService.paymentActionAsync(
                                requestId,
                                arbitraryAmount,
                                0,
                                {from: payer});
            
        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,arbitraryAmount,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });


    it('pay request with additional higher than amount', async () => {
        await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        let result = await rn.requestEthereumService.paymentActionAsync(
                                requestId,
                                1,
                                2,
                                {from: payer});
            
        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount+2,'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,1,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

    it('pay request with higher amount than expected', async () => {
        await rn.requestEthereumService.acceptAsync(
                                requestId,
                                {from: payer});

        let result = await rn.requestEthereumService.paymentActionAsync(
                                requestId,
                                arbitraryAmount+1,
                                0,
                                {from: payer});

        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,arbitraryAmount+1,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

});
