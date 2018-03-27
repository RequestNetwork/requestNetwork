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
let otherGuy: string;
let payerRefundAddress: string;
let currentNumRequest: any;
let payerWithoutToken: any;

let requestId: any;

describe('erc20 approveTokenForRequest & approveTokenForSignedRequest', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 200000;
    const arbitraryAmount3 = 30000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service('0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF');
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
        await testToken.transfer(payer, arbitraryAmount, {from: defaultAccount});        
      
        const res = await rn.requestERC20Service.approveTokenForRequest(
                    requestId,
                    arbitraryAmount,
                    {from: payer}).on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });

        utils.expectEqualsBN(res, arbitraryAmount, 'new allowance is wrong');
    });

    it('approve Token For Signed Request', async () => {
        const partialPignedRequest = { tokenAddress: '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF',
                          currencyContract: '0x345ca3e014aaf5dca488057592ee47305d9b3e10' };

        await testToken.transfer(payee2, arbitraryAmount2, {from: defaultAccount});        

        const res = await rn.requestERC20Service.approveTokenForSignedRequest(
                    partialPignedRequest,
                    arbitraryAmount2,
                    {from: payee2}).on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });

        utils.expectEqualsBN(res, arbitraryAmount2, 'new allowance is wrong');
    });

    it('get allowance for a Request', async () => {
        const tokenAddress = '0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF';
        const currencyContract = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';

        await testToken.transfer(payee2, arbitraryAmount3, {from: defaultAccount});        
        await testToken.approve(currencyContract, arbitraryAmount3, {from: payee2});
      
        const res = await rn.requestERC20Service.getTokenAllowance(
                                tokenAddress,
                                currencyContract,
                                {from: payee2});

        utils.expectEqualsBN(res, arbitraryAmount3, 'new allowance is wrong');
    });

});
