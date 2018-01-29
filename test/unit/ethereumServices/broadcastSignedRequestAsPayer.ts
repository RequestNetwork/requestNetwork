import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
import * as utils from '../../utils';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

const addressRequestEthereum = requestArtifacts('private', 'last-RequestEthereum').networks.private.address;
const addressRequestCore = requestArtifacts('private', 'last-RequestCore').networks.private.address;

let rn: any;
let web3: any;
let defaultAccount: string;
let payer: string;
let payee: string;
let otherGuy: string;

let currentNumRequest: any;

let signedRequest: any;

describe('createRequestAsPayer', () => {
    const arbitraryAmount = 100000000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        signedRequest = {
            amountInitial: '100000000',
            currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
            data: 'QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS',
            expirationDate: 7952342400,
            hash: '0x45ba3046df9e10f5b32c893ad21749d69c473d6629756654f82b9528da6c1480',
            payee: '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
            signature: '0x6df09d4c90bafea043d555caeb3d01d2dc656df2e27741b2b7f66403a682c69070d3ba30119598b766e5eb6413d49d6d91c349e23207b96102f54c69fca967d800'};
    });

    it('broadcast request as payer without extension', async () => {
        const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    150000,
                    20000,
                    {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount + 20000, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance, 150000, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        utils.expectEqualsObject(result.request.data.data, {'reason': 'weed purchased'}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('broadcast request as payer payer == payee', async () => {
        try { 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    150000,
                    20000,
                    {from: payee})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_from must be different than _payee'),'exception not right');
        }
    });

    it('broadcast request as payer amount to pay < 0', async () => {
        try { 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    -1,
                    20000,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_amountToPay must a positive integer'),'exception not right');
        }
    });

    it('broadcast request as payer additionals < 0', async () => {
        try { 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    2000,
                    -1,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_additionals must a positive integer'),'exception not right');
        }
    });


    it('broadcast request as hash not valid', async () => {
        try { 
            const signedRequest = {
                amountInitial: '100000000',
                currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
                data: 'QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS',
                expirationDate: 7952342400,
                hash: '0x9999999999999999999999999999999999999999999999999999999999999999',
                payee: '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
                signature: '0x6df09d4c90bafea043d555caeb3d01d2dc656df2e27741b2b7f66403a682c69070d3ba30119598b766e5eb6413d49d6d91c349e23207b96102f54c69fca967d800'};
 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    2000,
                    1000,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('hash is not valid'),'exception not right');
        }
    });

    it('broadcast request as signature not valid', async () => {
        try { 
            const signedRequest = {
                amountInitial: '100000000',
                currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
                data: 'QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS',
                expirationDate: 7952342400,
                hash: '0x45ba3046df9e10f5b32c893ad21749d69c473d6629756654f82b9528da6c1480',
                payee: '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
                signature: '0x6df09d4c90bafea043d555caeb3d01d2dc656df2e27741b2b7f66403a682c69070d3ba30119598b766e5eb6413d49d6d91c349e23207b96102f54c69fca967d801'};
 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    2000,
                    1000,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('payee is not the signer'),'exception not right');
        }
    });
});
