import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
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
let payee2: string;
let payee3: string;
let payerRefundAddress: string;
let payeePaymentAddress: string;
let payee3PaymentAddress: string;

let currentNumRequest: any;

let signedRequest: any;

describe('broadcastSignedRequestAsPayer', () => {
    const arbitraryAmount = 1000;
    const arbitraryAmount2 = 200;
    const arbitraryAmount3 = 300;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        signedRequest = { 
                currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
                data: 'QmZLVR5UwkiGLi9nxwTShYJjHbEEYNfBfCkLAy9bLuVrwh',
                expectedAmounts: [ arbitraryAmount, arbitraryAmount2, arbitraryAmount3 ],
                expirationDate: 7952313600,
                extension: undefined,
                extensionParams: undefined,
                hash: '0x5eef85ad314d6604ff95a9aecdb5339c5cd8dd3b2237716dac8cf20dc0fd7174',
                payeesIdAddress:
                    [ payee,
                     payee2,
                     payee3 ],
                payeesPaymentAddress:
                    [ payeePaymentAddress,
                      undefined,
                      payee3PaymentAddress ],
                signature: '0xb622372207416d5d377888d3756d5a866a03825f44a692eef2a064b2659a062d3c0ff3aafce4cba4ef37df92cee5f9e8e4bfdbd3fcad74aa2994ebe8c2bd24171c' }
    });

    it('broadcast request as payer no payment no additionals', async () => {
        const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(signedRequest)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        utils.expectEqualsObject(result.request.data.data,{"reason": "purchased two large pizzas"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress.toLowerCase(), 'payeePaymentAddress is wrong').to.equal(payeePaymentAddress);
        expect(result.request.currencyContract.payerRefundAddress, 'payerRefundAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1].toLowerCase(), 'payer is wrong').to.equal(payee3PaymentAddress);
    });


    it('broadcast request as payer with payments & additionals', async () => {
        const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                signedRequest,
                [arbitraryAmount+3,arbitraryAmount2+2,arbitraryAmount3+1],
                [3, 2, 1],
                {value: arbitraryAmount+arbitraryAmount2+arbitraryAmount3+6})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+3, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount+3, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        utils.expectEqualsObject(result.request.data.data,{"reason": "purchased two large pizzas"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, arbitraryAmount2+2, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2+2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, arbitraryAmount3+1, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3+1, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress.toLowerCase(), 'payeePaymentAddress is wrong').to.equal(payeePaymentAddress);
        expect(result.request.currencyContract.payerRefundAddress, 'payerRefundAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1].toLowerCase(), 'payer is wrong').to.equal(payee3PaymentAddress);
    });


    it('broadcast request simplest', async () => {
        signedRequest = { 
                currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
                expectedAmounts: [ arbitraryAmount ],
                expirationDate: 7952342400,
                hash: '0x523932ba871aae22a275485a4bbf27e4b1c67c1c030a29e2d17feb56a8084014',
                payeesIdAddress: [ payee ],
                signature: '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501' };
                  
        const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(signedRequest)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);
    });


    it('broadcast request as payer payer == payee', async () => {
        signedRequest = { 
                currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
                expectedAmounts: [ arbitraryAmount ],
                expirationDate: 7952342400,
                hash: '0x523932ba871aae22a275485a4bbf27e4b1c67c1c030a29e2d17feb56a8084014',
                payeesIdAddress: [ payee ],
                signature: '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501' };
                  
        try { 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    undefined,
                    undefined,
                    {from: payee})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_from must be different than main payee'),'exception not right');
        }
    });

    it('broadcast request as payer amount to pay < 0', async () => {
        signedRequest = { 
            currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
            expectedAmounts: [ arbitraryAmount ],
            expirationDate: 7952342400,
            hash: '0x523932ba871aae22a275485a4bbf27e4b1c67c1c030a29e2d17feb56a8084014',
            payeesIdAddress: [ payee ],
            signature: '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501' };
                  
        try { 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [new BN(-1)],
                    undefined,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_amountsToPay must be positive integers'),'exception not right');
        }
    });

    it('broadcast request as payer additionals < 0', async () => {
        signedRequest = { 
            currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
            expectedAmounts: [ arbitraryAmount ],
            expirationDate: 7952342400,
            hash: '0x523932ba871aae22a275485a4bbf27e4b1c67c1c030a29e2d17feb56a8084014',
            payeesIdAddress: [ payee ],
            signature: '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501' };

        try { 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [arbitraryAmount],
                    [new BN(-1)],
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_additionals must be positive integers'),'exception not right');
        }
    });


    it('broadcast request as hash not valid', async () => {
        try { 
            signedRequest = { 
                currencyContract: '0xf12b5dd4ead5f743c6baa640b0216200e89b60da',
                expectedAmounts: [ arbitraryAmount ],
                expirationDate: 7952342400,
                hash: '0x00000000071aae22a275485a4bbf27e4b1c67c1c030a29e2d17feb56a8084014',
                payeesIdAddress: [ payee ],
                signature: '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501' };

            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(signedRequest)
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('hash is not valid'),'exception not right');
        }
    });

    it('broadcast request as signature not valid', async () => {
        try { 
            signedRequest.signature = '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501';
 
            const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [2000],
                    [1000],
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('payee is not the signer'),'exception not right');
        }
    });

    it('sign + broadcast', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        const resultSigned = await rn.requestEthereumService.signRequestAsPayee(
                                                                        [defaultAccount],
                                                                        [arbitraryAmount],
                                                                        expirationDate);

        const result = await rn.requestEthereumService.broadcastSignedRequestAsPayer(
                resultSigned,
                [2000],
                [1000],
                {from: payer, value: 2000})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+1000, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 2000, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);
    });

});
