import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
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
let otherGuy: string;

let currentNumRequest: any;

describe('createRequestAsPayer', () => {
    const arbitraryAmount = 100000000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestEthereumService.web3Single.web3;

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        otherGuy = accounts[4].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();
    })

    it('create request as payer without extension', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayer( 
                    payee,
                    arbitraryAmount,
                    150000,
                    20000,
                    '{"reason":"weed purchased"}',
                    '',
                    [],
                    {from: payer})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount+20000, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.balance, 150000, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payer);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"},'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');
    });

    it('create request as payer without extension (implicit parameters)', async () => {
        const result = await rn.requestEthereumService.createRequestAsPayer( 
                    payee,
                    arbitraryAmount)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
        expect(result.transaction).to.have.property('hash'); 

        utils.expectEqualsBN(result.request.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        
        utils.expectEqualsBN(result.request.balance, 0, 'balance is wrong');
        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;
        expect(result.request.payee.toLowerCase(), 'payee is wrong').to.equal(payee);
        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestEthereum);

        expect(result.request.data, 'request.data is wrong').to.be.undefined;
    });

    it('create request as payer _payee not address', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayer( 
                    '0xNOTADDRESS',
                    arbitraryAmount);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_payee must be a valid eth address'),'exception not right');
        }
    });

    it('create request as payer payer == payee', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayer( 
                    defaultAccount,
                    arbitraryAmount);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_from must be different than _payee'),'exception not right');
        }
    });

    it('create request as payer amount < 0', async () => {
        try { 
            const result = await rn.requestEthereumService.createRequestAsPayer( 
                    payer,
                    new WEB3.utils.BN(-1));
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsObject(e, Error('_expectedAmount must a positive integer'),'exception not right');
        }
    });
});
