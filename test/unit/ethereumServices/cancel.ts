import {expect} from 'chai';
import 'mocha';
import Artifacts from '../../../src/artifacts';
import RequestNetwork from '../../../src/requestNetwork';
import * as utils from '../../utils';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

const addressRequestEthereum = Artifacts.requestEthereumArtifact.networks.private.address;
const addressSynchroneExtensionEscrow = Artifacts.requestSynchroneExtensionEscrowArtifact.networks.private.address;

let rn: any;
let web3: any;
let defaultAccount;
let payer: any;
let payee: any;
let otherGuy: any;

let coreVersion: any;
let currentNumRequest: any;

let requestId: any;

describe('cancel', () => {
    const arbitraryAmount = 100000000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        coreVersion = await rn.requestCoreService.getVersion();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        const req = await rn.requestEthereumService.createRequestAsPayee( 
            payer,
            arbitraryAmount,
            '',
            '',
            [],
            {from: payee});

        requestId = req.request.requestId;
    });

    it('cancel request with not valid requestId', async () => {
        try {
            const result = await rn.requestEthereumService.cancel(
                                '0x00000000000000',
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),'exception not right');
        }
    });

    it('cancel request by payer when created', async () => {
        const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(2);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('cancel request by otherGuy', async () => {
        try {
            const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: otherGuy});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('account must be the payer or the payee'),'exception not right');
        }
    })

    it('cancel request by payer when not created', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('payer can cancel request in state \'created\''),'exception not right');
        }
    })

    it('cancel request by payee when cancel', async () => {
        await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('payee cannot cancel request already canceled'),'exception not right');
        }
    })

    it('cancel request by payee when created', async () => {
        const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee});

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(2);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('cancel request by payee when accepted and balance == 0', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(2);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
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
            const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('impossible to cancel a Request with a balance != 0'),'exception not right');
        }
    })

});
