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

const payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
const payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
const payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

const payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
const payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
const payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

const arbitraryAmount = 100000000;
const arbitraryAmount2 = 20000000;
const arbitraryAmount3 =  3000000;

describe('bitcoinNodesValidation signRequestAsPayee', () => {
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
        payer = accounts[7].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 
    });

    it('sign request as payee', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();

        const result = await rn.requestBitcoinNodesValidationService.signRequestAsPayee(
            [payee, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            expirationDate,
            [payeePayment, payee2Payment, payee3Payment],
            undefined,
            undefined,
            undefined,
            payee);

        expect(result.currencyContract.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());
        expect(result, 'data is wrong').to.have.property('data');
        expect(result, 'hash is wrong').to.have.property('hash');
        expect(result, 'signature is wrong').to.have.property('signature');
        utils.expectEqualsBN(result.expirationDate, expirationDate, 'expirationDate is wrong');
        expect(result.extension, 'extension is wrong').to.be.undefined;
        expect(result.extensionParams, 'extensionParams is wrong').to.be.undefined;

        expect(result.payeesIdAddress[0].toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.expectedAmounts[0], arbitraryAmount, 'expectedAmount is wrong');
        expect(result.payeesPaymentAddress[0], 'payeePaymentAddress payee is wrong').to.equal(payeePayment);

        expect(result.payeesIdAddress[1].toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.expectedAmounts[1], arbitraryAmount2, 'expectedAmount is wrong');
        expect(result.payeesPaymentAddress[1], 'payeePaymentAddress payee2 is wrong').to.equal(payee2Payment);

        expect(result.payeesIdAddress[2].toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.expectedAmounts[2], arbitraryAmount3, 'expectedAmount is wrong');
        expect(result.payeesPaymentAddress[2], 'payeePaymentAddress payee3 is wrong').to.equal(payee3Payment);

        const signatureRPClike = ETH_UTIL.fromRpcSig(result.signature);
        const pub = ETH_UTIL.ecrecover(ETH_UTIL.hashPersonalMessage(ETH_UTIL.toBuffer(result.hash)), signatureRPClike.v, signatureRPClike.r, signatureRPClike.s);
        const addrBuf = ETH_UTIL.pubToAddress(pub);
        const addr    = ETH_UTIL.bufferToHex(addrBuf);
        expect(payee.toLowerCase(), 'signature is wrong').to.equal(addr.toLowerCase());
    });

    it('sign request as payer expirationDate too soon', async () => {
        const expirationDate: number = (new Date('2000-01-01').getTime()) / 1000;
        try {
            const result = await rn.requestBitcoinNodesValidationService.signRequestAsPayee(
                                        [payee, payee2, payee3],
                                        [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                                        expirationDate,
                                        [payeePayment, payee2Payment, payee3Payment],
                                        undefined,
                                        undefined,
                                        undefined,
                                        payee);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_expirationDate must be greater than now'), 'exception not right');
        }
    });

    it('sign request as payer amount < 0', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        try {
            const result = await rn.requestBitcoinNodesValidationService.signRequestAsPayee(
                        [payee, payee2, payee3],
                        [new WEB3.utils.BN(-1), arbitraryAmount2, arbitraryAmount3],
                        expirationDate,
                        [payeePayment, payee2Payment, payee3Payment],
                        undefined,
                        undefined,
                        undefined,
                        payee);

            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_expectedAmounts must be positive integers'),'exception not right');
        }
    });

});
