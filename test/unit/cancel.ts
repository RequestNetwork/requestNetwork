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

describe('cancel', () => {
    var arbitraryAmount = 100000000;
    rn = new RequestNetwork();
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async() => {
        var accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        coreVersion = await rn.requestCoreService.getVersion();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        let req = await rn.requestEthereumService.createRequestAsPayee( 
            payer,
            arbitraryAmount,
            '',
            '', 
            [],
            {from: payee});

        requestId = req.request.requestId;
    })

    it('cancel request with not valid requestId', async () => {
        try {
            let result = await rn.requestEthereumService.cancel(
                                '0x00000000000000',
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),'exception not right');
        }
    });

    it('cancel request by payer when created', async () => {
        let result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer})
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
        expect(result.request.state, 'state is wrong').to.equal('2');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

    it('cancel request by otherGuy', async () => {
        try {
            let result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: otherGuy});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('account must be the payer or the payee'),'exception not right');
        }
    })

    it('cancel request by payer when not created', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        try {
            let result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('payer can cancel request in state \'created\''),'exception not right');
        }
    })

    it('cancel request by payee when cancel', async () => {
        await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer});

        try {
            let result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('payee cannot cancel request already canceled'),'exception not right');
        }
    })

    it('cancel request by payee when created', async () => {
        let result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee});

        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance,0,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('2');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });


    it('cancel request by payee when accepted and balance == 0', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data:any) => {
                expect(data, 'data.transactionHash is wrong').to.have.property('transactionHash');
            });

        let result = await rn.requestEthereumService.cancel(
                                requestId,
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
        expect(result.request.state, 'state is wrong').to.equal('2');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });


    it('cancel request by payee when accepted and balance != 0', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        await rn.requestEthereumService.paymentAction(
                        requestId,
                        1,
                        0,
                        {from: payer});

        try {
            let result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee});
            expect(false,'exception not thrown').to.be.true; 
        } catch(e) {
            utils.expectEqualsObject(e,Error('impossible to cancel a Request with a balance != 0'),'exception not right');
        }
    })

});
