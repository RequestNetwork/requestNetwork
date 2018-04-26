import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';
import BitcoinServiceTest from './bitcoin-service-test';

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

var payeePaymentNoTxs = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';
var payeeRefundNoTxs = 'mx7AkR2D45VqsjREqEXot8wMjcRMCyQvwS';

var payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
var payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
var payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';

var payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
var payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
var payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

describe('bitcoin NodesValidation getTransactionHash', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 2000000;
    const arbitraryAmount3 = 300000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestBitcoinNodesValidationService.web3Single.web3;
    BitcoinServiceTest.init();
    rn.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();

    beforeEach(async () => {
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

    it('createRequestAsPayee getRequestByTransactionHash', async () => {
        const result = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee],
                    [arbitraryAmount],
                    payer,
                    [payeePaymentNoTxs],
                    [payeeRefundNoTxs]);

        const data: any = await rn.requestCoreService.getRequestByTransactionHash(result.transaction.hash);

        expect(data.transaction.method.name, 'name is wrong').to.equal('createRequestAsPayeeAction');
        expect(data.transaction.method.parameters._payer.toLowerCase(), '_payer is wrong').to.equal(payer);
        expect(data.transaction.method.parameters._expectedAmounts[0], '_expectedAmount is wrong').to.equal(arbitraryAmount.toString());
        expect(data.transaction.method.parameters._payeesPaymentAddress, '_payeesPaymentAddress is wrong').to.equal('0x226d6f704d70317470517a435862584b4c483955565178446f6144456a4d37366d7576');
        expect(data.transaction.method.parameters._payerRefundAddress, '_payerRefundAddress is wrong').to.equal('0x226d7837416b52324434355671736a52457145586f7438774d6a63524d437951767753');

        expect(data.transaction.method.parameters._data, '_data is wrong').to.equal('');
    });

    it('accept getRequestByTransactionHash', async () => {
        const resultCreateRequestAsPayee = await rn.requestBitcoinNodesValidationService.createRequestAsPayee(
                    [payee],
                    [arbitraryAmount],
                    payer,
                    [payeePaymentNoTxs],
                    [payeeRefundNoTxs]);

        const resultAccept = await rn.requestERC20Service.accept(
                            resultCreateRequestAsPayee.request.requestId,
                            {from: payer});

        const data: any = await rn.requestCoreService.getRequestByTransactionHash(resultAccept.transaction.hash);
        expect(data.transaction.method.name, 'name is wrong').to.equal('acceptAction');
        expect(data.transaction.method.parameters._requestId, '_requestId is wrong').to.equal(resultCreateRequestAsPayee.request.requestId);

        utils.expectEqualsBN(data.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(data.request.payee.balance, 0, 'balance is wrong');
        expect(data.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(data.request.extension, 'extension is wrong').to.be.undefined;
        expect(data.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(data.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(data.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(data.request.state, 'state is wrong').to.equal(1);
        expect(data.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestBitcoinNodesValidation.toLowerCase());
    });
});

