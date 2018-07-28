import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';
import BitcoinServiceTest from './bitcoin-service-mock';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;
const addressRequestBitcoinNodesValidation = requestArtifacts('private', 'last-RequestBitcoinNodesValidation').networks.private.address;
const addressRequestCore = requestArtifacts('private', 'last-RequestCore').networks.private.address;

let rn: any;
let web3: any;
let defaultAccount: string;
let payer: string;
let payee: string;
let payee2: string;
let payee3: string;
let payeePaymentNoTxsAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;
let randomAddress: string;
let currentNumRequest: any;
let requestId: string;

const payeePaymentNoTxs = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';
const payeeRefundNoTxs = 'mx7AkR2D45VqsjREqEXot8wMjcRMCyQvwS';

const payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
const payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
const payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

const payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
const payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
const payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

const arbitraryAmount = 100000000;
const arbitraryAmount2 = 2000000;
const arbitraryAmount3 = 300000;

describe('bitcoin NodesValidation getRequestEvents', () => {
    beforeEach(async () => {
        rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
        web3 = rn.requestBitcoinNodesValidationService.web3Single.web3;
        BitcoinServiceTest.init();
        rn.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();
    
        const accounts = await web3.eth.getAccounts();
        payee = accounts[0].toLowerCase();
        randomAddress = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentNoTxsAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 
    });


    it('getRequestEvents', async () => {
        const resultCreateRequestAsPayee = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePayment,payee2Payment,payee3Payment],
                    [payeeRefund,payee2Refund,payee3Refund]);
        currentNumRequest++;

        const resultReduce = await rn.requestBitcoinNodesValidationService.reduceExpectedAmounts(
                            resultCreateRequestAsPayee.request.requestId,
                            [10, 20, 30],
                            {from: defaultAccount});

        const events: any = await rn.requestCoreService.getRequestEvents(resultCreateRequestAsPayee.request.requestId);

        expect(events[0].name, 'name events is wrong').to.equal('UpdateBalance');
        expect(events[0].data.payeeIndex, 'payeeIndex is wrong').to.equal(0);
        utils.expectEqualsBN(events[0].data.deltaAmount, '111111', 'deltaAmount 0 is wrong');
        expect(events[0].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[1].name, 'name events is wrong').to.equal('UpdateBalance');
        expect(events[1].data.payeeIndex, 'payeeIndex is wrong').to.equal(2);
        utils.expectEqualsBN(events[1].data.deltaAmount, '44444', 'deltaAmount 2 is wrong');
        expect(events[1].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[2].name, 'name events is wrong').to.equal('UpdateBalance');
        expect(events[2].data.payeeIndex, 'payeeIndex is wrong').to.equal(1);
        utils.expectEqualsBN(events[2].data.deltaAmount, '-99999', 'deltaAmount 1 is wrong');
        expect(events[2].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[3].name, 'name events is wrong').to.equal('Created');
        expect(events[3].data.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(events[3].data.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(events[3].data.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(events[3].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));
        expect(events[3].data.data, 'payee is wrong').to.equal('');

        expect(events[4].name, 'name events is wrong').to.equal('NewSubPayee');
        expect(events[4].data.payee.toLowerCase(), 'payee is wrong').to.equal(payee2);
        expect(events[4].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[5].name, 'name events is wrong').to.equal('NewSubPayee');
        expect(events[5].data.payee.toLowerCase(), 'payee is wrong').to.equal(payee3);
        expect(events[5].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[6].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[6].data.payeeIndex, 'payee is wrong').to.equal('0');
        expect(events[6].data.deltaAmount, 'payee is wrong').to.equal('-10');
        expect(events[6].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[7].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[7].data.payeeIndex, 'payee is wrong').to.equal('1');
        expect(events[7].data.deltaAmount, 'payee is wrong').to.equal('-20');
        expect(events[7].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

        expect(events[8].name, 'name events is wrong').to.equal('UpdateExpectedAmount');
        expect(events[8].data.payeeIndex, 'payee is wrong').to.equal('2');
        expect(events[8].data.deltaAmount, 'payee is wrong').to.equal('-30');
        expect(events[8].data.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, currentNumRequest));

    });
});

