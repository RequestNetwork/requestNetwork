import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';
import TestToken from '../../centralBank';

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
let payeePaymentAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;
let randomAddress: string;
let currentNumRequest: any;

let signedRequest: any;

describe('erc20 broadcastSignedRequestAsPayer', () => {
    const arbitraryAmount = 1000;
    const arbitraryAmount2 = 200;
    const arbitraryAmount3 = 30;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    
    const instanceCentralBank = new web3.eth.Contract(TestToken.abi, ADDRESS_TOKEN_TEST);
    const testToken = new Erc20Service('0x345cA3e014Aaf5dcA488057592ee47305D9B3e10');
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

        signedRequest = { 
            currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
            data: 'QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS',
            expectedAmounts: [ '1000', '200', '30' ],
            expirationDate: 7952342400000,
            extension: undefined,
            extensionParams: undefined,
            hash: '0xe03268113d12c1a728ba6bc5631649d041d905e2a4dd19b8e5789a22b7800c5e',
            payeesIdAddress:
                [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544',
                 '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2',
                 '0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e' ],
            payeesPaymentAddress:
                [ '0x6330a553fc93768f612722bb8c2ec78ac90b3bbc',
                 undefined,
                 '0x5aeda56215b167893e80b4fe645ba6d5bab767de' ],
            signature: '0x3d3e6110c4d6f851e444aee6740446dec0bad1fd22cda8d892565188a3fe6d3e6739efb7a6b3c6fef201e60b36300cb3200d162259422a0eda1da1e2fe96c98001' };
    });

    it.skip('broadcast request as payer no payment no additionals', async function () {
        const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(signedRequest)
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"}, 'data.data is wrong')
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

    it.skip('broadcast request as payer with payments & additionals', async function () {
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
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+3, 'expectedAmount is wrong');
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
        signedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
                          expectedAmounts: [ '1000' ],
                          expirationDate: 7952342400000,
                          hash: '0x41813608ee5d1b1716cf9bf6705da4ae1f019ebfcfcd129cdd27d01ed02140a9',
                          payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                          signature: '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700' }

        const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(signedRequest)
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
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);
    });

    it('broadcast request as payer payer == payee', async () => {
        signedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
                          expectedAmounts: [ '1000' ],
                          expirationDate: 7952342400000,
                          hash: '0x41813608ee5d1b1716cf9bf6705da4ae1f019ebfcfcd129cdd27d01ed02140a9',
                          payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                          signature: '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700' }

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
        signedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
                          expectedAmounts: [ '1000' ],
                          expirationDate: 7952342400000,
                          hash: '0x41813608ee5d1b1716cf9bf6705da4ae1f019ebfcfcd129cdd27d01ed02140a9',
                          payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                          signature: '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700' }

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
        signedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
                          expectedAmounts: [ '1000' ],
                          expirationDate: 7952342400000,
                          hash: '0x41813608ee5d1b1716cf9bf6705da4ae1f019ebfcfcd129cdd27d01ed02140a9',
                          payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                          signature: '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700' }

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
            signedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
                          expectedAmounts: [ '1000' ],
                          expirationDate: 7952342400000,
                          hash: '0x000000000000001716cf9bf6705da4ae1f019ebfcfcd129cdd27d01ed02140a9',
                          payeesIdAddress: [ '0x821aea9a577a9b44299b9c15c88cf3087f3b5544' ],
                          signature: '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700' }

            const result = await rn.requestERC20Service.broadcastSignedRequestAsPayer(signedRequest)
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('hash is not valid'),'exception not right');
        }
    });

    it('broadcast request as signature not valid', async () => {
        try { 
            signedRequest.signature = '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700';
 
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
        await instanceCentralBank.methods.mint(arbitraryAmount).send({from: payer});
        await rn.requestERC20Service.approveTokenForSignedRequest(resultSigned, arbitraryAmount, {from: payer});

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


    it('broadcast request as payer with allowance too low', async function () {
        // approve
        await rn.requestERC20Service.approveTokenForSignedRequest(signedRequest, arbitraryAmount+arbitraryAmount2+arbitraryAmount3+6-1, {from: defaultAccount});

        try {
            await rn.requestERC20Service.broadcastSignedRequestAsPayer(
                signedRequest,
                [arbitraryAmount+3,arbitraryAmount2+2,arbitraryAmount3+1],
                [3, 2, 1])
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('allowance of token is too low'),'exception not right');
        }

    });

    it('broadcast request as payer with allowance too low but skipERC20checkAllowance', async function () {
        // approve
        await rn.requestERC20Service.approveTokenForSignedRequest(signedRequest, 0, {from: defaultAccount});

        try {
            await rn.requestERC20Service.broadcastSignedRequestAsPayer(
                signedRequest,
                [arbitraryAmount+3,arbitraryAmount2+2,arbitraryAmount3+1],
                [3, 2, 1],
                {skipERC20checkAllowance:true})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('Returned error: VM Exception while processing transaction: revert'),'exception not right');
        }

    });
});
