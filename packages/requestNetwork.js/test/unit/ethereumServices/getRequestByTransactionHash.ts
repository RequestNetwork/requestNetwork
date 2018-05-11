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
let currentNumRequest: any;

describe('getRequestByTransactionHash', () => {
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
        payee3PaymentAddress = accounts[9].toLowerCase();;
        
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();
    });

    it('createRequestAsPayee getRequestByTransactionHash', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayee(
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer);
        const data: any = await rn.requestCoreService.getRequestByTransactionHash(result.transaction.hash);

        expect(data.transaction.method.name, 'name is wrong').to.equal('createRequestAsPayee');
        expect(data.transaction.method.parameters._payer.toLowerCase(), '_payer is wrong').to.equal(payer);
        expect(data.transaction.method.parameters._expectedAmounts[0], '_expectedAmount is wrong').to.equal(arbitraryAmount.toString());
        expect(data.transaction.method.parameters._expectedAmounts[1], '_expectedAmount is wrong').to.equal(arbitraryAmount2.toString());
        expect(data.transaction.method.parameters._expectedAmounts[2], '_expectedAmount is wrong').to.equal(arbitraryAmount3.toString());
        expect(data.transaction.method.parameters._data, '_data is wrong').to.equal('');
    });

    it('accept getRequestByTransactionHash', async () => {
        const resultCreateRequestAsPayee = await rn.requestEthereumService.createRequestAsPayee(
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer);

        const resultAccept = await rn.requestEthereumService.accept(
                            resultCreateRequestAsPayee.request.requestId,
                            {from: payer});

        const data: any = await rn.requestCoreService.getRequestByTransactionHash(resultAccept.transaction.hash);
        expect(data.transaction.method.name, 'name is wrong').to.equal('accept');
        expect(data.transaction.method.parameters._requestId, '_requestId is wrong').to.equal(resultCreateRequestAsPayee.request.requestId);

        utils.expectEqualsBN(data.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(data.request.payee.balance, 0, 'balance is wrong');
        expect(data.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(data.request.extension, 'extension is wrong').to.be.undefined;
        expect(data.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(data.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(data.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(data.request.state, 'state is wrong').to.equal(1);
        expect(data.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(data.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(data.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(data.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(data.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(data.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(data.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

    });

    it('paymentAction getRequestByTransactionHash', async () => {
        const resultCreateRequestAsPayee = await rn.requestEthereumService.createRequestAsPayee(
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer);

        const resultAccept = await rn.requestEthereumService.accept(
                            resultCreateRequestAsPayee.request.requestId,
                            {from: payer});

        const resultPaymentAction = await rn.requestEthereumService.paymentAction(
                            resultCreateRequestAsPayee.request.requestId,
                            [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                            [1, 2, 3],
                            {from: payer});

        const data: any = await rn.requestCoreService.getRequestByTransactionHash(resultPaymentAction.transaction.hash);

        expect(data.transaction.method.name, 'name is wrong').to.equal('paymentAction');
        expect(data.transaction.method.parameters._requestId, '_requestId is wrong').to.equal(resultCreateRequestAsPayee.request.requestId);
        expect(data.transaction.method.parameters._payeeAmounts[0], '_payeeAmounts[0] is wrong').to.equal(arbitraryAmount.toString());
        expect(data.transaction.method.parameters._payeeAmounts[1], '_payeeAmounts[1] is wrong').to.equal(arbitraryAmount2.toString());
        expect(data.transaction.method.parameters._payeeAmounts[2], '_payeeAmounts[2] is wrong').to.equal(arbitraryAmount3.toString());

        expect(data.transaction.method.parameters._additionalAmounts[0], '_additionals[0] is wrong').to.equal('1');
        expect(data.transaction.method.parameters._additionalAmounts[1], '_additionals[1] is wrong').to.equal('2');
        expect(data.transaction.method.parameters._additionalAmounts[2], '_additionals[2] is wrong').to.equal('3');

        utils.expectEqualsBN(data.request.payee.expectedAmount, arbitraryAmount + 1, 'expectedAmount is wrong');
        utils.expectEqualsBN(data.request.payee.balance, arbitraryAmount, 'balance is wrong');
        expect(data.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(data.request.extension, 'extension is wrong').to.be.undefined;
        expect(data.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(data.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(data.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(data.request.state, 'state is wrong').to.equal(1);
        expect(data.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

    });

    it('not valid txHash getRequestByTransactionHash', async () => {
        try {
            await rn.requestCoreService.getRequestByTransactionHash('0x9999999999999999999999999999999999999999999999999999999999999999');
        } catch (e) {
            expect(e.message, 'exception not right').to.equal('transaction not found');
        }
    });

    it('not tx request getRequestByTransactionHash', async () => {
        const tx = await web3.eth.sendTransaction({from: defaultAccount,
                                                    to: payee3PaymentAddress,
                                                    value: 100000});
        try {
            await rn.requestCoreService.getRequestByTransactionHash(tx.transactionHash);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.equal('Contract is not supported by request');
        }
    });

});

