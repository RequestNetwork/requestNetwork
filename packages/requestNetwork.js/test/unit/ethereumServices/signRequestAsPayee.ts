import {expect} from 'chai';
import 'mocha';
import * as ETH_UTIL from 'ethereumjs-util';
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

describe('signRequestAsPayee', () => {
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
    });

    it('sign request as payer without extension', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        const result = await rn.requestEthereumService.signRequestAsPayee(
                    arbitraryAmount,
                    expirationDate,
                    '{"reason":"weed purchased"}',
                    '',
                    [],
                    payee);
        utils.expectEqualsBN(result.amountInitial, arbitraryAmount, 'amountInitial is wrong');
        expect(result.currencyContract.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);
        expect(result, 'data is wrong').to.have.property('data');
        expect(result, 'hash is wrong').to.have.property('hash');
        expect(result, 'signature is wrong').to.have.property('signature');
        utils.expectEqualsBN(result.expirationDate, expirationDate / 1000, 'expirationDate is wrong');
        expect(result.extension, 'extension is wrong').to.be.undefined;
        expect(result.extensionParams, 'extensionParams is wrong').to.be.undefined;
        expect(result.payee.toLowerCase(), 'payee is wrong').to.equal(payee);

        const signatureRPClike = ETH_UTIL.fromRpcSig(result.signature);
        const pub = ETH_UTIL.ecrecover(ETH_UTIL.hashPersonalMessage(ETH_UTIL.toBuffer(result.hash)), signatureRPClike.v, signatureRPClike.r, signatureRPClike.s);
        const addrBuf = ETH_UTIL.pubToAddress(pub);
        const addr    = ETH_UTIL.bufferToHex(addrBuf);
        expect(result.payee.toLowerCase(), 'signature is wrong').to.equal(addr.toLowerCase());
    });

    it('sign request as payer without extension (implicit parameters)', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        const result = await rn.requestEthereumService.signRequestAsPayee(
                    arbitraryAmount,
                    expirationDate);

        utils.expectEqualsBN(result.amountInitial, arbitraryAmount, 'amountInitial is wrong');
        expect(result.currencyContract.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);
        expect(result.data, 'request.data is wrong').to.be.undefined;
        expect(result, 'hash is wrong').to.have.property('hash');
        expect(result, 'signature is wrong').to.have.property('signature');
        utils.expectEqualsBN(result.expirationDate, expirationDate / 1000, 'expirationDate is wrong');
        expect(result.extension, 'extension is wrong').to.be.undefined;
        expect(result.extensionParams, 'extensionParams is wrong').to.be.undefined;
        expect(result.payee.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);

        const signatureRPClike = ETH_UTIL.fromRpcSig(result.signature);
        const pub = ETH_UTIL.ecrecover(ETH_UTIL.hashPersonalMessage(ETH_UTIL.toBuffer(result.hash)), signatureRPClike.v, signatureRPClike.r, signatureRPClike.s);
        const addrBuf = ETH_UTIL.pubToAddress(pub);
        const addr    = ETH_UTIL.bufferToHex(addrBuf);
        expect(result.payee.toLowerCase(), 'signature is wrong').to.equal(addr.toLowerCase());
    });

    it('sign request as payer expirationDate too soon', async () => {
        const expirationDate: number = new Date('2000-01-01').getTime();
        try {
            const result = await rn.requestEthereumService.signRequestAsPayee(
                    arbitraryAmount,
                    expirationDate);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsObject(e, Error('_expirationDate must be greater than now'), 'exception not right');
        }
    });

    it('sign request as payer amount < 0', async () => {
        const expirationDate: number = new Date('2222-01-01').getTime();
        try {
            const result = await rn.requestEthereumService.signRequestAsPayee(
                    new WEB3.utils.BN(-1),
                    expirationDate);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsObject(e, Error('_amountInitial must a positive integer'),'exception not right');
        }
    });

});
