import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
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
let otherGuy: string;
let payerRefundAddress: string;
let currentNumRequest: any;
let payerWithoutToken: any;

let requestId: any;

describe('erc20 approveTokenForRequest & approveTokenForSignedRequest', () => {
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
        payerWithoutToken = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payee3PaymentAddress = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        otherGuy = accounts[9].toLowerCase();

        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        const req = await rn.requestERC20Service.createRequestAsPayee(
            addressTestToken,
            [payee, payee2, payee3],
            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
            payer,
            [payeePaymentAddress],
            payerRefundAddress,
            undefined,
            undefined,
            undefined,
            {from: payee});

        requestId = req.request.requestId;
    });

    it('approve Token For Request', async () => {
        await instanceCentralBank.methods.mint(arbitraryAmount).send({from: payer});       
      
        const res = await rn.requestERC20Service.approveTokenForRequest(
                    requestId,
                    arbitraryAmount,
                    {from: payer}).on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });

        utils.expectEqualsBN(res, arbitraryAmount, 'new allowance is wrong');
    });

    it('approve Token For Signed Request', async () => {
        const partialPignedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf' };

        await instanceCentralBank.methods.mint(arbitraryAmount2).send({from: payee2});     

        const res = await rn.requestERC20Service.approveTokenForSignedRequest(
                    partialPignedRequest,
                    arbitraryAmount2,
                    {from: payee2}).on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });

        utils.expectEqualsBN(res, arbitraryAmount2, 'new allowance is wrong');
    });

    it('get allowance for a Request', async () => {
        const partialPignedRequest = { currencyContract: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf' };

        const res2 = await rn.requestERC20Service.approveTokenForSignedRequest(
                    partialPignedRequest,
                    arbitraryAmount3,
                    {from: payee2});

        const res = await rn.requestERC20Service.getTokenAllowance(
                                partialPignedRequest.currencyContract,
                                {from: payee2});

        utils.expectEqualsBN(res, arbitraryAmount3, 'new allowance is wrong');
    });

});
