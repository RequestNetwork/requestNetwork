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
let payeePaymentAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;
let randomAddress: string;
let currentNumRequest: any;
let requestId: string;

const payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
const payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
const payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

const payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
const payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
const payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

const arbitraryAmount = 100000000;
const arbitraryAmount2 = 2000000;
const arbitraryAmount3 = 300000;

describe('bitcoin NodesValidation addPayerRefundAddress', () => {
    beforeEach(async () => {
        rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
        web3 = rn.requestBitcoinNodesValidationService.web3Single.web3;
        BitcoinServiceTest.init();
        rn.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();

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

        const req = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePayment,payee2Payment,payee3Payment]);

        requestId = req.request.requestId;
    });

    it('cannot add refund address on request with not valid requestId', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                '0x00000000000000',
                                [payeeRefund,payee2Refund,payee3Refund],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_requestId must be a 32 bytes hex string'),'exception not right');
        }
    });

    it('can add refund address', async () => {
        const result = await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                requestId,
                                [payeeRefund,payee2Refund,payee3Refund],
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());

        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.currencyContract.payeeRefundAddress, 'payerRefundAddress is wrong').to.equal(payeeRefund);
        expect(result.request.currencyContract.subPayeesRefundAddress[0], 'subPayeesRefundAddress0 is wrong').to.equal(payee2Refund);
        expect(result.request.currencyContract.subPayeesRefundAddress[1], 'subPayeesRefundAddress1 is wrong').to.equal(payee3Refund);
    });

    it('cannot add refund address by payee or otherguy', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                requestId,
                                [payeeRefund,payee2Refund,payee3Refund],
                                {from: payee});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be the payer'),'exception not right');
        }

        try {
            const result = await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                requestId,
                                [payeeRefund,payee2Refund,payee3Refund],
                                {from: randomAddress});
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('account must be the payer'),'exception not right');
        }
    });

    it('cannot add refund address with address missing', async () => {
        try {
            const result = await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                requestId,
                                [payeeRefund,payee2Refund],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payerRefundAddress must have the same size as the number of payees'),'exception not right');
        }
    });


    it('cannot add refund address if alrpayeready given', async () => {
        try {
            await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                requestId,
                                [payeeRefund,payee2Refund,payee3Refund],
                                {from: payer});

            const result = await rn.requestBitcoinNodesValidationService.addPayerRefundAddressAction(
                                requestId,
                                [payeeRefund,payee2Refund,payee3Refund],
                                {from: payer});
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payerRefundAddress has been already given'),'exception not right');
        }
    });
});
