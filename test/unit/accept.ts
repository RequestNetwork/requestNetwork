import {expect} from 'chai';
import 'mocha';
import * as utils from '../utils';

var Web3 = require('web3');
const BN = Web3.utils.BN;

import RequestNetwork from '../../src/requestNetwork';
import Artifacts from '../../src/artifacts';
const addressRequestEthereum = Artifacts.RequestEthereumArtifact.networks.private.address;
const addressSynchroneExtensionEscrow = Artifacts.RequestSynchroneExtensionEscrowArtifact.networks.private.address;

var rn;
var web3;
var defaultAccount;
var payer;
var payee;
var otherGuy;

var coreVersion;
var currentNumRequest;

var requestId;

describe('accept', () => {
    var arbitraryAmount = 100000000;
    rn = new RequestNetwork();
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async() => {
        var accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        coreVersion = await rn.requestCoreService.getVersion();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();

        let req = await rn.requestEthereumService.createRequestAsPayee(
            payer,
            arbitraryAmount,
            '',
            '',
            [],
            {from: payee});

        requestId = req.request.requestId;
    })

    it('accept request with not valid requestId', async () => {
        try {
            let result = await rn.requestEthereumService.accept(
                                '0x00000000000000',
                                {from: payer});
            expect(false,'exception not thrown').to.be.true;
        } catch(e) {
            utils.expectEqualsObject(e,Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),'exception not right');
        }
    });

    it('accept request', async () => {
        let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data, 'data.transactionHash is wrong').to.have.property('transactionHash');
            });

        utils.expectEqualsBN(result.request.expectedAmount,arbitraryAmount,'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance,0,'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion,++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal('1');
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result, 'result.transactionHash is wrong').to.have.property('transactionHash');
    });

    it('accept request by payee or otherguy', async () => {
        try {
            let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payee});
            expect(false,'exception not thrown').to.be.true;
        } catch(e) {
            utils.expectEqualsObject(e,Error('account must be the payer'),'exception not right');
        }

        try {
            let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: otherGuy});
            expect(false,'exception not thrown').to.be.true;
        } catch(e) {
            utils.expectEqualsObject(e,Error('account must be the payer'),'exception not right');
        }
    });

    it('accept request not in created state', async () => {
        try {
            // accept first
            await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});

            let result = await rn.requestEthereumService.accept(
                                requestId,
                                {from: payer});
            expect(false,'exception not thrown').to.be.true;
        } catch(e) {
            utils.expectEqualsObject(e,Error('request state is not \'created\''),'exception not right');
        }
    });

});
