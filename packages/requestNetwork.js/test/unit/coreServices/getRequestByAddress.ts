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
let payeePaymentAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;

let coreVersion: any;
let requestId: any;

describe('getRequestsByAddress', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 200000;
    const arbitraryAmount3 = 30000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();

        const req = await rn.requestEthereumService.createRequestAsPayee(
            [payee , payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            payer,
            [payeePaymentAddress,undefined,payee3PaymentAddress],
            payerRefundAddress,
            undefined,
            undefined,
            undefined,
            {from: payee});

         requestId = req.request.requestId;
    });

    it('getRequestsByAddress payee', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payee);
        expect(data.asPayee.length, 'data.asPayee is wrong').not.to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').to.equal(0);
    });

    it('getRequestsByAddress payer', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payer);
        expect(data.asPayee.length, 'data.asPayee is wrong').to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').not.to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').to.equal(0);
    });
    it('getRequestsByAddress subPayee 2', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payee2);
        expect(data.asPayee.length, 'data.asPayee is wrong').to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').not.to.equal(0);
    });

    it('getRequestsByAddress subPayee 3', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payee3);
        expect(data.asPayee.length, 'data.asPayee is wrong').to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').not.to.equal(0);
    });


    it('getRequestsByAddress payment address payer', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payerRefundAddress);
        expect(data.asPayee.length, 'data.asPayee is wrong').to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').to.equal(0);
    });
    it('getRequestsByAddress payment address payeePaymentAddress', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payeePaymentAddress);
        expect(data.asPayee.length, 'data.asPayee is wrong').to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').to.equal(0);
    });
    it('getRequestsByAddress payment address payee3PaymentAddress', async () => {
        const data: any = await rn.requestCoreService.getRequestsByAddress(payee3PaymentAddress);
        expect(data.asPayee.length, 'data.asPayee is wrong').to.equal(0);
        expect(data.asPayer.length, 'data.asPayer is wrong').to.equal(0);
        expect(data.asSubPayee.length, 'data.asSubPayee is wrong').to.equal(0);
    });
});

