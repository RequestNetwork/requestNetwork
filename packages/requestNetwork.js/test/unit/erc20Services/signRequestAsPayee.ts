import {expect} from 'chai';
import 'mocha';
import * as ETH_UTIL from 'ethereumjs-util';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';

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

describe('erc20 signRequestAsPayee', () => {
    const arbitraryAmount = '100000000';
    const arbitraryAmount2 = '20000000';
    const arbitraryAmount3 =  '3000000';
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service(ADDRESS_TOKEN_TEST);
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        randomAddress = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 
    });

    it('sign request as payer without extension', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();

        const result = await rn.requestERC20Service.signRequestAsPayee(
            ADDRESS_TOKEN_TEST,
            [payee, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            expirationDate,
            [payeePaymentAddress, 0, payee3PaymentAddress],
            undefined,
            undefined,
            undefined,
            payee);

        expect(result.currencyContract.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);
        expect(result.tokenAddress.toLowerCase(), 'tokenAddress is wrong').to.equal(ADDRESS_TOKEN_TEST);
        expect(result, 'data is wrong').to.have.property('data');
        expect(result, 'hash is wrong').to.have.property('hash');
        expect(result, 'signature is wrong').to.have.property('signature');
        utils.expectEqualsBN(result.expirationDate, expirationDate, 'expirationDate is wrong');
        expect(result.extension, 'extension is wrong').to.be.undefined;
        expect(result.extensionParams, 'extensionParams is wrong').to.be.undefined;

        expect(result.payeesIdAddress[0].toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.expectedAmounts[0], 'expectedAmount is wrong').to.equal(arbitraryAmount);
        expect(result.payeesPaymentAddress[0].toLowerCase(), 'payeePaymentAddress payee is wrong').to.equal(payeePaymentAddress);

        expect(result.payeesIdAddress[1].toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        expect(result.expectedAmounts[1], 'payee2 expectedAmount is wrong').to.equal(arbitraryAmount2);
        expect(result.payeesPaymentAddress[1], 'payeePaymentAddress payee2 is wrong').to.be.undefined;

        expect(result.payeesIdAddress[2].toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        expect(result.expectedAmounts[2], 'payee3 expectedAmount is wrong').to.equal(arbitraryAmount3);
        expect(result.payeesPaymentAddress[2].toLowerCase(), 'payeePaymentAddress payee3 is wrong').to.equal(payee3PaymentAddress);

        const signatureRPClike = ETH_UTIL.fromRpcSig(result.signature);
        const pub = ETH_UTIL.ecrecover(ETH_UTIL.hashPersonalMessage(ETH_UTIL.toBuffer(result.hash)), signatureRPClike.v, signatureRPClike.r, signatureRPClike.s);
        const addrBuf = ETH_UTIL.pubToAddress(pub);
        const addr    = ETH_UTIL.bufferToHex(addrBuf);
        expect(payee.toLowerCase(), 'signature is wrong').to.equal(addr.toLowerCase());
    });

    it('sign request as payer without extension (implicit parameters)', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();

        const result = await rn.requestERC20Service.signRequestAsPayee(
            ADDRESS_TOKEN_TEST,
            [defaultAccount, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            expirationDate);

        expect(result.currencyContract.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);
        expect(result.tokenAddress.toLowerCase(), 'tokenAddress is wrong').to.equal(ADDRESS_TOKEN_TEST);
        expect(result.data, 'data is wrong').to.be.undefined;
        expect(result, 'hash is wrong').to.have.property('hash');
        expect(result, 'signature is wrong').to.have.property('signature');
        utils.expectEqualsBN(result.expirationDate, expirationDate, 'expirationDate is wrong');
        expect(result.extension, 'extension is wrong').to.be.undefined;
        expect(result.extensionParams, 'extensionParams is wrong').to.be.undefined;

        expect(result.payeesIdAddress[0].toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(result.expectedAmounts[0], 'expectedAmount is wrong').to.equal(arbitraryAmount);
        expect(result.payeesPaymentAddress[0], 'payeePaymentAddress payee is wrong').to.be.undefined;

        expect(result.payeesIdAddress[1].toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        expect(result.expectedAmounts[1], 'payee2 expectedAmount is wrong').to.equal(arbitraryAmount2);
        expect(result.payeesPaymentAddress[1], 'payeePaymentAddress payee2 is wrong').to.be.undefined;

        expect(result.payeesIdAddress[2].toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        expect(result.expectedAmounts[2], 'payee3 expectedAmount is wrong').to.equal(arbitraryAmount3);
        expect(result.payeesPaymentAddress[2], 'payeePaymentAddress payee3 is wrong').to.be.undefined;

        const signatureRPClike = ETH_UTIL.fromRpcSig(result.signature);
        const pub = ETH_UTIL.ecrecover(ETH_UTIL.hashPersonalMessage(ETH_UTIL.toBuffer(result.hash)), signatureRPClike.v, signatureRPClike.r, signatureRPClike.s);
        const addrBuf = ETH_UTIL.pubToAddress(pub);
        const addr    = ETH_UTIL.bufferToHex(addrBuf);
        expect(defaultAccount.toLowerCase(), 'signature is wrong').to.equal(addr.toLowerCase());
    });

    it('sign request as payer expirationDate too soon', async () => {
        const expirationDate: number = (new Date('2000-01-01').getTime()) / 1000;
        try {
            const result = await rn.requestERC20Service.signRequestAsPayee(
            ADDRESS_TOKEN_TEST,
                [defaultAccount, payee2, payee3],
                [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                expirationDate);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_expirationDate must be greater than now'), 'exception not right');
        }
    });

    it('sign request as payer amount < 0', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        try {
            const result = await rn.requestERC20Service.signRequestAsPayee(
                    ADDRESS_TOKEN_TEST,
                    [defaultAccount, payee2, payee3],
                    [new WEB3.utils.BN(-1), arbitraryAmount2, arbitraryAmount3],
                    expirationDate);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_expectedAmounts must be positives integer'),'exception not right');
        }
    });


    it('token not supported', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        try { 
            const result = await rn.requestERC20Service.signRequestAsPayee(
                    '0x0000000000000000000000000000000000000000',
                    [defaultAccount],
                    [arbitraryAmount],
                    expirationDate);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('token not supported'),'exception not right');
        }
    });
});
