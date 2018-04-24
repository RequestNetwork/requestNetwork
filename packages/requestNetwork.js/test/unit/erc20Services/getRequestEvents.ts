import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
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

let coreVersion: any;
let currentNumRequest: any;

describe('erc20 getRequestEvents', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 200000;
    const arbitraryAmount3 = 30000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service(ADDRESS_TOKEN_TEST);
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();;
        
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();
    });

    it('getRequestEvents', async () => {
        const resultCreateRequestAsPayee = await rn.requestERC20Service.createRequestAsPayee(
                    ADDRESS_TOKEN_TEST,
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer);
        currentNumRequest++;

        const resultSubtract = await rn.requestERC20Service.subtractAction(
                            resultCreateRequestAsPayee.request.requestId,
                            [10, 20, 30],
                            {from: defaultAccount});

        await testToken.transfer(payer, arbitraryAmount+arbitraryAmount2+arbitraryAmount3, {from: defaultAccount});        
        await rn.requestERC20Service.approveTokenForRequest(resultCreateRequestAsPayee.request.requestId, arbitraryAmount+arbitraryAmount2+arbitraryAmount3, {from: payer})

        const resultPaymentAction = await rn.requestERC20Service.paymentAction(
                            resultCreateRequestAsPayee.request.requestId,
                            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                            [1, 2, 3],
                            {from: payer});

        const events: any = await rn.requestCoreService.getRequestEvents(resultCreateRequestAsPayee.request.requestId);

        expect(events[0].name, 'name events is wrong').to.equal('Created');
        expect(events[0].data.payee.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(events[0].data.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(events[0].data.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(events[0].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));
        expect(events[0].data.data, 'payee is wrong').to.equal('');

        expect(events[1].name, 'name events is wrong').to.equal('NewSubPayee');
        expect(events[1].data.payee.toLowerCase(), 'payee is wrong').to.equal(payee2);
        expect(events[1].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[2].name, 'name events is wrong').to.equal('NewSubPayee');
        expect(events[2].data.payee.toLowerCase(), 'payee is wrong').to.equal(payee3);
        expect(events[2].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[3].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[3].data.payeeIndex, 'payee is wrong').to.equal('0');
        expect(events[3].data.deltaAmount, 'payee is wrong').to.equal('-10');
        expect(events[3].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[4].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[4].data.payeeIndex, 'payee is wrong').to.equal('1');
        expect(events[4].data.deltaAmount, 'payee is wrong').to.equal('-20');
        expect(events[4].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[5].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[5].data.payeeIndex, 'payee is wrong').to.equal('2');
        expect(events[5].data.deltaAmount, 'payee is wrong').to.equal('-30');
        expect(events[5].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[6].name, 'name events is wrong').to.equal('Accepted');
        expect(events[6].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[7].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[7].data.payeeIndex, 'payee is wrong').to.equal('0');
        expect(events[7].data.deltaAmount, 'payee is wrong').to.equal('1');
        expect(events[7].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[8].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[8].data.payeeIndex, 'payee is wrong').to.equal('1');
        expect(events[8].data.deltaAmount, 'payee is wrong').to.equal('2');
        expect(events[8].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[9].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[9].data.payeeIndex, 'payee is wrong').to.equal('2');
        expect(events[9].data.deltaAmount, 'payee is wrong').to.equal('3');
        expect(events[9].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[10].name, 'name events is wrong').to.equal('UpdateBalance');
        expect(events[10].data.payeeIndex, 'payee is wrong').to.equal('0');
        expect(events[10].data.deltaAmount, 'payee is wrong').to.equal(arbitraryAmount.toString());
        expect(events[10].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[11].name, 'name events is wrong').to.equal('UpdateBalance');
        expect(events[11].data.payeeIndex, 'payee is wrong').to.equal('1');
        expect(events[11].data.deltaAmount, 'payee is wrong').to.equal(arbitraryAmount2.toString());
        expect(events[11].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[12].name, 'name events is wrong').to.equal('UpdateBalance');
        expect(events[12].data.payeeIndex, 'payee is wrong').to.equal('2');
        expect(events[12].data.deltaAmount, 'payee is wrong').to.equal(arbitraryAmount3.toString());
        expect(events[12].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));
    });
});

