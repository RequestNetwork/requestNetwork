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
let defaultAccount: string;
let payer: string;
let payee: string;
let otherGuy: string;

let coreVersion: any;
let currentNumRequest: any;

let requestId: any;

describe('paymentAction', () => {
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
    })

    it('pay request', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestEthereumService.paymentAction(
                            requestId,
                            arbitraryAmount,
                            0,
                            {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance,arbitraryAmount,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with additional', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestEthereumService.paymentAction(
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
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with not valid requestId', async () => {
        const result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.paymentAction(
                                '0x00000000000000',
                                arbitraryAmount,
                                0,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),'exception not right');
        }
    });

    it('pay request with not valid additional', async () => {
        const result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                arbitraryAmount,
                                -1,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_additional must a positive integer'),'exception not right');
        }
    });

    it('pay request with not valid amount', async () => {
        const result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                -1,
                                0,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_amount must a positive integer'),'exception not right');
        }
    });

    it('pay request canceled', async () => {
        const result = await rn.requestEthereumService.cancel(
                                requestId,
                                {from: payer});

        try {
            const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                arbitraryAmount,
                                0,
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('request must be accepted'),'exception not right');
        }
    });

    it('pay request created', async () => {
        const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                arbitraryAmount,
                                0,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
            
        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,arbitraryAmount,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with additional higher than amount', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                1,
                                2,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
            
        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount+2,'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,1,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('pay request with higher amount than expected', async () => {
        await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

        const result = await rn.requestEthereumService.paymentAction(
                                requestId,
                                arbitraryAmount+1,
                                0,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,arbitraryAmount+1,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

});
