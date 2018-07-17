import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import BitcoinServiceTest from './bitcoin-service-mock';
import * as utils from '../../utils';
import * as ETH_UTIL from 'ethereumjs-util';

const WEB3 = require('web3');

const BN = WEB3.utils.BN;

const addressRequestBitcoinNodesValidation = requestArtifacts('private', 'last-RequestBitcoinNodesValidation').networks.private.address;
const addressRequestCore = requestArtifacts('private', 'last-RequestCore').networks.private.address;

let rn: any;
let web3: any;
let payer: string;
let payee: string;
let payee2: string;
let payee3: string;
let randomAddress: string;
let currentNumRequest: any;

let signedRequest: any;

const payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
const payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
const payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

const payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
const payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
const payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

const arbitraryAmount = 100000000;
const arbitraryAmount2 = 20000000;
const arbitraryAmount3 =  3000000;

describe('bitcoin NodesValidation broadcastSignedRequestAsPayer', () => {    
    beforeEach(async () => {
        rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
        web3 = rn.requestBitcoinNodesValidationService.web3Single.web3;
        BitcoinServiceTest.init();
        rn.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();

        const accounts = await web3.eth.getAccounts();
        payer = accounts[0].toLowerCase();
        payee = accounts[1].toLowerCase();
        randomAddress = accounts[2].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 

        signedRequest = { 
            currencyContract: '0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F',
            data: undefined,
            expectedAmounts: [ '100000000', '20000000', '3000000' ],
            expirationDate: 7952342400000,
            extension: undefined,
            extensionParams: undefined,
            hash: '0x7e99529c10051143abe2aa0af62be1a160a80115d65bbd804d9ec02b766da313',
            payeesIdAddress:
                [ '0xf17f52151ebef6c7334fad080c5704d77216b732',
                 '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2',
                 '0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e' ],
            payeesPaymentAddress:
                [ 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs',
                 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV',
                 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y' ],
            signature: '0x529c11c91795abdc19bf115bfbeea3e0156afc64d09f059024a898d7c6cd8ed5352f8c57310c8531e1f7cbe0f06f64a017274c27453fc9155c2ae3739d6bcafb00' };
    });

    it('broadcast request as payer no payment no additionals', async function () {
        const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(signedRequest,
                                                                                            [payeeRefund,payee2Refund,payee3Refund],
                                                                                            undefined,
                                                                                            {from:payer}
            ).on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'payee balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        expect(result.data, 'data is wrong').to.be.undefined;
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, '-99999', 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, '44444', 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.equal(payeePayment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.equal(payee2Payment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.equal(payee3Payment);

        expect(result.request.currencyContract.payeeRefundAddress, 'payerRefundAddress is wrong').to.equal(payeeRefund);
        expect(result.request.currencyContract.subPayeesRefundAddress[0], 'subPayeesRefundAddress0 is wrong').to.equal(payee2Refund);
        expect(result.request.currencyContract.subPayeesRefundAddress[1], 'subPayeesRefundAddress1 is wrong').to.equal(payee3Refund);
    });

    it('broadcast request as payer with additionals', async function () {
        const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(signedRequest,
                                                                                            [payeeRefund,payee2Refund,payee3Refund],
                                                                                            [1,2,3],
                                                                                            {from:payer}
            ).on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+1, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'payee balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        expect(result.data, 'data is wrong').to.be.undefined;
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, '-99999', 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2+2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, '44444', 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3+3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.equal(payeePayment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.equal(payee2Payment);
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.equal(payee3Payment);

        expect(result.request.currencyContract.payeeRefundAddress, 'payerRefundAddress is wrong').to.equal(payeeRefund);
        expect(result.request.currencyContract.subPayeesRefundAddress[0], 'subPayeesRefundAddress0 is wrong').to.equal(payee2Refund);
        expect(result.request.currencyContract.subPayeesRefundAddress[1], 'subPayeesRefundAddress1 is wrong').to.equal(payee3Refund);
    });

    it('broadcast request as payer payer == payee', async () => {
        signedRequest = { currencyContract: '0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F',
                          expectedAmounts: [ '100000000' ],
                          expirationDate: 7952342400000,
                          hash: '0x8396dd1d54c5297f77cacd85ea934a520d6ce466058e0c2b54b5160122433a8f',
                          payeesIdAddress: [ '0xf17f52151ebef6c7334fad080c5704d77216b732' ],
                          payeesPaymentAddress: [ 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs' ],
                          signature: '0x17fa2ceb56622e3341a76105fcb64ddaa1dc04fc3a82e935644a7854bf95e2ba1f335bd5904288f88dc7c330108f37f22df2a56b99aa698a45e174074f30b45c00' };
        try { 
            const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [payeeRefund],
                    undefined,
                    {from: '0xf17f52151ebef6c7334fad080c5704d77216b732'})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_from must be different than main payee'),'exception not right');
        }
    });

    it('broadcast request as payer additionals < 0', async () => {
        signedRequest = { currencyContract: '0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F',
                          expectedAmounts: [ '100000000' ],
                          expirationDate: 7952342400000,
                          hash: '0x8396dd1d54c5297f77cacd85ea934a520d6ce466058e0c2b54b5160122433a8f',
                          payeesIdAddress: [ '0xf17f52151ebef6c7334fad080c5704d77216b732' ],
                          payeesPaymentAddress: [ 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs' ],
                          signature: '0x17fa2ceb56622e3341a76105fcb64ddaa1dc04fc3a82e935644a7854bf95e2ba1f335bd5904288f88dc7c330108f37f22df2a56b99aa698a45e174074f30b45c00' };

        try { 
            const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [payeeRefund],
                    [new BN(-1)],
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_additionals must be positive integers'),'exception not right');
        }
    });

    it('broadcast request as hash not valid', async () => {
        try { 
            signedRequest = { currencyContract: '0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F',
                          expectedAmounts: [ '100000000' ],
                          expirationDate: 7952342400000,
                          hash: '0x1396dd1d54c5297f77cacd85ea934a520d6ce466058e0c2b54b5160122433a8f',
                          payeesIdAddress: [ '0xf17f52151ebef6c7334fad080c5704d77216b732' ],
                          payeesPaymentAddress: [ 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs' ],
                          signature: '0x17fa2ceb56622e3341a76105fcb64ddaa1dc04fc3a82e935644a7854bf95e2ba1f335bd5904288f88dc7c330108f37f22df2a56b99aa698a45e174074f30b45c00' };

            const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(signedRequest, [payeeRefund])
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('hash is not valid'),'exception not right');
        }
    });

    it('broadcast request as signature not valid', async () => {
        try { 
            signedRequest.signature = '0xcf21f170df2aa3c80dd2b40e68b4b5af8f26b2097bd3c33922fa68e68819ce4f797a11724f9ef94f7730b03e7e82db926b9bfbe5b9d83d6204115173eaaf136700';
 
            const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(
                    signedRequest,
                    [payeeRefund],
                    undefined,
                    {from: payer})
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('payee is not the signer'),'exception not right');
        }
    });

    it('sign + broadcast', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();

        const resultSigned = await rn.requestBitcoinNodesValidationService.signRequestAsPayee(
            [payee, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            expirationDate,
            [payeePayment, payee2Payment, payee3Payment],
            undefined,
            undefined,
            undefined,
            payee);

        const result = await rn.requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(
                resultSigned,
                [payeeRefund, payee2Refund, payee3Refund],
                [1000],
                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.transaction).to.have.property('hash');

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+1000, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, '111111', 'payee balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());
        expect(result.request.data, 'request.data is wrong').to.be.undefined;
        
    });
});
