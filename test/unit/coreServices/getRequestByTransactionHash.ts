import {expect} from 'chai';
import 'mocha';
import Artifacts from '../../../src/artifacts';
import RequestNetwork from '../../../src/requestNetwork';
import * as utils from '../../utils';

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

const addressRequestEthereum = Artifacts.requestEthereumArtifact.networks.private.address;
const addressSynchroneExtensionEscrow = Artifacts.requestSynchroneExtensionEscrowArtifact.networks.private.address;

let rn: any;
let web3: any;
let defaultAccount: string;
let payer: string;
let payee: string;
let otherGuy: string;

let coreVersion: any;
let currentNumRequest: any;

describe('getRequestByTransactionHash', () => {
    const arbitraryAmount = 100000000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        coreVersion = await rn.requestCoreService.getVersion();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();
    });

    it('createRequestAsPayee getRequestByTransactionHash', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayee(
                    payer,
                    arbitraryAmount);
        const data: any = await rn.requestCoreService.getRequestByTransactionHash(result.transaction.hash);

        expect(data.transaction.method.name, 'name is wrong').to.equal('createRequestAsPayee');

        expect(data.transaction.method.parameters._payer.toLowerCase(), '_payer is wrong').to.equal(payer);
        expect(data.transaction.method.parameters._expectedAmount, '_expectedAmount is wrong').to.equal(arbitraryAmount.toString());
        expect(data.transaction.method.parameters._extension, '_extension is wrong').to.equal('0x0000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams.length, '_extensionParams length is wrong').to.equal(9);

        expect(data.transaction.method.parameters._extensionParams[0], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[1], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[2], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[3], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[4], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[5], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[6], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[7], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(data.transaction.method.parameters._extensionParams[8], '_extensionParams is wrong').to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');

        expect(data.transaction.method.parameters._data, '_data is wrong').to.equal('');
    });

    it('accept getRequestByTransactionHash', async () => {
        const resultCreateRequestAsPayee = await rn.requestEthereumService.createRequestAsPayee(
                    payer,
                    arbitraryAmount);

        const resultAccept = await rn.requestEthereumService.accept(
                            resultCreateRequestAsPayee.request.requestId,
                            {from: payer});

        const data: any = await rn.requestCoreService.getRequestByTransactionHash(resultAccept.transaction.hash);
        expect(data.transaction.method.name, 'name is wrong').to.equal('accept');
        expect(data.transaction.method.parameters._requestId, '_requestId is wrong').to.equal(resultCreateRequestAsPayee.request.requestId);

        utils.expectEqualsBN(data.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(data.request.balance, 0, 'balance is wrong');
        expect(data.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(data.request.extension, 'extension is wrong').to.be.undefined;
        expect(data.request.payee.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(data.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(data.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(data.request.state, 'state is wrong').to.equal(1);
        expect(data.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);
    });

    it('paymentAction getRequestByTransactionHash', async () => {
        const resultCreateRequestAsPayee = await rn.requestEthereumService.createRequestAsPayee(
                    payer,
                    arbitraryAmount);

        const resultAccept = await rn.requestEthereumService.accept(
                            resultCreateRequestAsPayee.request.requestId,
                            {from: payer});

        const resultPaymentAction = await rn.requestEthereumService.paymentAction(
                            resultCreateRequestAsPayee.request.requestId,
                            arbitraryAmount,
                            10,
                            {from: payer});

        const data: any = await rn.requestCoreService.getRequestByTransactionHash(resultPaymentAction.transaction.hash);

        expect(data.transaction.method.name, 'name is wrong').to.equal('paymentAction');
        expect(data.transaction.method.parameters._requestId, '_requestId is wrong').to.equal(resultCreateRequestAsPayee.request.requestId);
        expect(data.transaction.method.parameters._additionals, '_additionals is wrong').to.equal('10');

        utils.expectEqualsBN(data.request.expectedAmount, arbitraryAmount + 10, 'expectedAmount is wrong');
        utils.expectEqualsBN(data.request.balance, arbitraryAmount, 'balance is wrong');
        expect(data.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(data.request.extension, 'extension is wrong').to.be.undefined;
        expect(data.request.payee.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(data.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(data.request.requestId, 'requestId is wrong').to.equal(
                                    utils.getHashRequest(coreVersion, ++currentNumRequest));
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
                                                    to: otherGuy,
                                                    value: 100000});
        try {
            await rn.requestCoreService.getRequestByTransactionHash(tx.transactionHash);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            expect(e.message, 'exception not right').to.equal('Contract is not supported by request');
        }
    });

});
