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
let randomAddress: string;
let currentNumRequest: any;

let signedRequest: any;

describe('erc20 broadcastSignedRequestAsPayer', () => {
    const arbitraryAmount = 1000;
    const arbitraryAmount2 = 200;
    const arbitraryAmount3 = 300;
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
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        signedRequest = { tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                          currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                          data: 'QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS',
                          expectedAmounts: [ '100000000', '20000000', '3000000' ],
                          expirationDate: 7952342400000,
                          extension: undefined,
                          extensionParams: undefined,
                          hash: '0x7226fcac983f28898c1478e3f1e83fa3c4b27126fc056594b8538cb5392800ae',
                          payeesIdAddress:
                           [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
                             '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2',
                             '0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e' ],
                          payeesPaymentAddress:
                           [ '0x6330a553fc93768f612722bb8c2ec78ac90b3bbc',
                             undefined,
                             '0x5aeda56215b167893e80b4fe645ba6d5bab767de' ],
                          signature: '0x40ce18afe3833b06c89f0909e23dc6482973b74261672500edfaf978de1c8f983b98367be26d90e0ba2e158d8f831d5939bc65d82543205c866f8d607a005b8c01' };
    });

    it('broadcast request as payer no payment no additionals', async () => {
        const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(signedRequest)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, '100000000', 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, '20000000', 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, '3000000', 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress.toLowerCase(), 'payeePaymentAddress is wrong').to.equal(payeePaymentAddress);
        expect(result.request.currencyContract.payerRefundAddress, 'payerRefundAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1].toLowerCase(), 'payer is wrong').to.equal(payee3PaymentAddress);
    });


    it('broadcast request as payer with payments & additionals', async () => {
        // approve
        await rn.requestERC20Service.approveTokenForSignedRequest(signedRequest, arbitraryAmount+arbitraryAmount2+arbitraryAmount3+6, {from: defaultAccount});

        const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(
                signedRequest,
                [arbitraryAmount+3,arbitraryAmount2+2,arbitraryAmount3+1],
                [3, 2, 1])
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, '100000003', 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount+3, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, arbitraryAmount2+2, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, '20000002', 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, arbitraryAmount3+1, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, '3000001', 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress.toLowerCase(), 'payeePaymentAddress is wrong').to.equal(payeePaymentAddress);
        expect(result.request.currencyContract.payerRefundAddress, 'payerRefundAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1].toLowerCase(), 'payer is wrong').to.equal(payee3PaymentAddress);
    });

    it('broadcast request simplest', async () => {
        signedRequest = {  
                tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                expectedAmounts: [ '100000000' ],
                expirationDate: 7952342400000,
                hash: '0x7d6a390e8ce21b5e55bba9a38e9516982d0d040601c080e8bb8330d613cae107',
                payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                signature: '0xc35fc55e1649bd371e27b09ced70e596d2715a96288d6f63536a30103f665fa433aa864f4d719535fab8d48f8de39fa5579cca819a1dd20a36b5be6e1855ef1000' };

        const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(signedRequest)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, '100000000', 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);
    });

    it('broadcast request as payer payer == payee', async () => {
        signedRequest = {  
                tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                expectedAmounts: [ '100000000' ],
                expirationDate: 7952342400000,
                hash: '0x7d6a390e8ce21b5e55bba9a38e9516982d0d040601c080e8bb8330d613cae107',
                payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                signature: '0xc35fc55e1649bd371e27b09ced70e596d2715a96288d6f63536a30103f665fa433aa864f4d719535fab8d48f8de39fa5579cca819a1dd20a36b5be6e1855ef1000' };

        try { 
            const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(
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
                tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                expectedAmounts: [ '100000000' ],
                expirationDate: 7952342400000,
                hash: '0x7d6a390e8ce21b5e55bba9a38e9516982d0d040601c080e8bb8330d613cae107',
                payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                signature: '0xc35fc55e1649bd371e27b09ced70e596d2715a96288d6f63536a30103f665fa433aa864f4d719535fab8d48f8de39fa5579cca819a1dd20a36b5be6e1855ef1000' };
        
        try { 
            const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [new BN(-1)],
                    undefined,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_amountsToPay must be positives integer'),'exception not right');
        }
    });

    it('broadcast request as payer additionals < 0', async () => {
        signedRequest = {  
                tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                expectedAmounts: [ '100000000' ],
                expirationDate: 7952342400000,
                hash: '0x7d6a390e8ce21b5e55bba9a38e9516982d0d040601c080e8bb8330d613cae107',
                payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                signature: '0xc35fc55e1649bd371e27b09ced70e596d2715a96288d6f63536a30103f665fa433aa864f4d719535fab8d48f8de39fa5579cca819a1dd20a36b5be6e1855ef1000' };

        try { 
            const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [arbitraryAmount],
                    [new BN(-1)],
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_additionals must be positives integer'),'exception not right');
        }
    });

    it('broadcast request as hash not valid', async () => {
        try { 
            signedRequest = {  
                tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                expectedAmounts: [ '100000000' ],
                expirationDate: 7952342400000,
                hash: '0x0d6a390e8ce21b5e55bba9a38e9516982d0d040601c080e8bb8330d613cae107',
                payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                signature: '0xc35fc55e1649bd371e27b09ced70e596d2715a96288d6f63536a30103f665fa433aa864f4d719535fab8d48f8de39fa5579cca819a1dd20a36b5be6e1855ef1000' };
        
            const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(signedRequest)
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('hash is not valid'),'exception not right');
        }
    });

    it('broadcast request as signature not valid', async () => {
        try { 
            signedRequest.signature = '0x479de55dc2de60873a72f3f59f2d167388ca31163ebd272702ae4fcd750e6b8b5caa13c34958cd33282703ecad5146960cd7004714b8fd3a0e7db26dfbccdcb501';
 
            const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(
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
        const resultSigned = await rn.requestERC20Service.signRequestAsPayee(
                                                                        addressTestToken,
                                                                        [defaultAccount],
                                                                        [arbitraryAmount],
                                                                        expirationDate);
        // approve
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForSignedRequest(resultSigned, arbitraryAmount, {from: payer})
        const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(
                resultSigned,
                [arbitraryAmount],
                [1000],
                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+1000, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);
    });

});
