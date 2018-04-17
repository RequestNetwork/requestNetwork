import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/requestNetwork';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';
import TestToken from '../../centralBank';

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
let randomAddress: string;
let currentNumRequest: any;

let signedRequest: any;

describe('erc20 createRequestAsPayer', () => {
    const arbitraryAmount = 1000;
    const arbitraryAmount2 = 200;
    const arbitraryAmount3 = 30;
    const additional =  100;
    const additional3 =  10;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    
    const instanceCentralBank = new web3.eth.Contract(TestToken.abi, ADDRESS_TOKEN_TEST);
    const testToken = new Erc20Service('0x345cA3e014Aaf5dcA488057592ee47305D9B3e10');
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest();
    });


    it('create request as payer', async () => {
        // approve
        await rn.requestERC20Service.approveTokenFromTokenAddress(addressTestToken, arbitraryAmount+arbitraryAmount2+arbitraryAmount3+6, {from: defaultAccount});

        const result = await rn.requestERC20Service.createRequestAsPayer(
                    addressTestToken,
                    [payee, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payerRefundAddress,
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    [additional, 0, additional3],
                    '{"reason":"weed purchased"}',
                    undefined,
                    undefined,
                    {from: defaultAccount})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.transaction).to.have.property('hash'); 

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount+additional, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, arbitraryAmount, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20.toLowerCase());

        utils.expectEqualsObject(result.request.data.data,{"reason": "weed purchased"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, arbitraryAmount2, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, arbitraryAmount3, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3+additional3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.payerRefundAddress.toLowerCase(), 'payerRefundAddress is wrong').to.equal(payerRefundAddress);
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.be.undefined;
    });


    it('create request as payer (implicit parameters)', async () => {
        const result = await rn.requestERC20Service.createRequestAsPayer(
                    addressTestToken,
                    [payee, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3])
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });
        expect(result.transaction).to.have.property('hash'); 

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(defaultAccount);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(1);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20.toLowerCase());
        expect(result.request.data, 'request.data is wrong').to.be.undefined;

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.payerRefundAddress, 'payerRefundAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.be.undefined;

    });


    it('create request as payer _payee not address', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayer(
                        addressTestToken,
                        ['0xNOTADDRESS'],
                        [arbitraryAmount])
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });;
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress must be valid eth addresses'),'exception not right');
        }
    });

    it('create request as payer token not address', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayer(
                        '0xNOTADDRESS',
                        [payee],
                        [arbitraryAmount])
                .on('broadcasted', (data: any) => {
                    expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
                });;
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('token not supported'),'exception not right');
        }
    });


    it('create request as payer payer == payee', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayer(
                    addressTestToken, 
                    [defaultAccount],
                    [arbitraryAmount]);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_from must be different than the main payee'),'exception not right');
        }
    });

    it('create request as payer amount < 0', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayer( 
                    addressTestToken,
                    [payee],
                    [new WEB3.utils.BN(-1)]);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_expectedAmounts must be positives integer'),'exception not right');
        }
    });

    it('create request with different array size', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayer( 
                    addressTestToken,
                    [defaultAccount, payee2],
                    [arbitraryAmount]);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress and _expectedAmounts must have the same size'),'exception not right');
        }
    });
});
