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

describe('createRequestAsPayee', () => {
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
    })

    it('create request without extension', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayee( 
                    payer,
                    arbitraryAmount,
                    '{"reason":"weed purchased"}',
                    '',
                    [],
                    {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"},'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('create request without extension (implicit parameters)', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayee( 
                    payer,
                    arbitraryAmount)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
        expect(result.transaction).to.have.property('hash'); 

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.request.data, 'request.data is wrong').to.be.undefined;
    });

    it('create request _payer not address', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayee( 
                    '0xNOTADDRESS',
                    arbitraryAmount);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_payer must be a valid eth address'),'exception not right');
        }
    });

    it('create request payer == payee', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayee( 
                    defaultAccount,
                    arbitraryAmount);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_payer must be a valid eth address'),'exception not right');
        }
    });

    it('create request amount < 0', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayee( 
                    payer,
                    new WEB3.utils.BN(-1));
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_expectedAmount must a positive integer'),'exception not right');
        }
    });

    it('create request _extension not address', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayee( 
                    payer,
                    arbitraryAmount,
                    '',
                    '0xNOTADDRESS');
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_extension must be a valid eth address'),'exception not right');
        }
    });

    it('create request _extension not handled', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayee( 
                    payer,
                    arbitraryAmount,
                    '',
                    addressRequestEthereum);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_extension is not supported'),'exception not right');
        }
    });

    it('create request with _extension handled', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayee( 
                payer,
                arbitraryAmount,
                '',
                addressSynchroneExtensionEscrow,
                [otherGuy])
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.transaction).to.have.property('hash'); 

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getHashRequest(coreVersion, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);
        expect(result.request.extension.address.toLowerCase(), 'extension.address is wrong').to.equal(addressSynchroneExtensionEscrow);

        expect(result.request.data, 'request.data is wrong').to.be.undefined;
    });
});
