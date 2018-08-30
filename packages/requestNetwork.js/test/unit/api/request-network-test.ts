import RequestNetwork, {Request, SignedRequest, Types, utils } from '../../../src/index';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import currencyUtils from '../../../src/utils/currency';
const Web3 = require('web3');
const BigNumber = require('bn.js');
import BitcoinServiceTest from '../bitcoinNodesValidationServices/bitcoin-service-mock';

const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const should = chai.should()
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

describe('Request Network API', () => {
    let accounts: Array<string>;
    let requestNetwork: RequestNetwork|any;
    let examplePayees: Array<any>;
    let examplePayer: any;

    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();

        examplePayees = [{
            idAddress: accounts[0],
            paymentAddress: accounts[0],
            additional: 5,
            expectedAmount: 100,
        }];
        examplePayer = {
            idAddress: accounts[1],
            refundAddress: accounts[1],
        };

        requestNetwork = new RequestNetwork({
            provider: 'http://localhost:8545',
            ethNetworkId: 10000000000
        });
        
        BitcoinServiceTest.init();
        requestNetwork.requestBitcoinNodesValidationService.bitcoinService = BitcoinServiceTest.getInstance();
    });
    

    it('can accept custom ipfs node', async () => {
       const requestNetwork = new RequestNetwork({
           ipfsCustomNode: {
                host: "myipfsgateway.com", 
                port: "5001", 
                protocol: "https",
            },
            provider: 'http://localhost:8545',
            ethNetworkId: 10000000000
       });
       const ipfsConfig = requestNetwork.requestCoreService.ipfs.ipfsConfig;
       expect(ipfsConfig.host).to.be.equal("myipfsgateway.com");
       expect(ipfsConfig.protocol).to.be.equal("https");
       expect(ipfsConfig.port).to.be.equal("5001");
    });

    it('can work with useIpfsPublic = false', async () => {
       const requestNetwork = new RequestNetwork({
            useIpfsPublic: false,
            provider: 'http://localhost:8545',
            ethNetworkId: 10000000000
       });
       const ipfsConfig = requestNetwork.requestCoreService.ipfs.ipfsConfig;
       expect(ipfsConfig.host).to.be.equal("localhost");
       expect(ipfsConfig.protocol).to.be.equal("http");
       expect(ipfsConfig.port).to.be.equal("5001");
    });

    it('can work with useIpfsPublic = true', async () => {
       const requestNetwork = new RequestNetwork({
            useIpfsPublic: true,
            provider: 'http://localhost:8545',
            ethNetworkId: 10000000000
       });
       const ipfsConfig = requestNetwork.requestCoreService.ipfs.ipfsConfig;
       expect(ipfsConfig.host).to.be.equal("ipfs.infura.io");
       expect(ipfsConfig.protocol).to.be.equal("https");
       expect(ipfsConfig.port).to.be.equal("5001");
    });

    it('cannot accept custom ipfs node with parameter missing', async () => {
        try {
            const requestNetwork = new RequestNetwork({
               ipfsCustomNode: {
                    host: "localhost", 
                    port: "5001",
                },
                provider: 'http://localhost:8545',
                ethNetworkId: 10000000000
            });
            expect.fail();
        } catch (error) {
            expect(error).to.exist;
        }
    });

    it('can be created with default parameters', async () => {
       const requestNetwork = new RequestNetwork();
       expect(requestNetwork).to.exist;
    });

    it('can be created with the legacy way of passing parameters', async () => {
       const requestNetwork = new RequestNetwork('http://localhost:8545', 10000000000);
       expect(requestNetwork).to.exist;
    });

    it('allows direct access to the services', async () => {
       const requestNetwork = new RequestNetwork();
       expect(requestNetwork.requestCoreService).to.exist;
       expect(requestNetwork.requestERC20Service).to.exist;
       expect(requestNetwork.requestEthereumService).to.exist;
       expect(requestNetwork.requestBitcoinNodesValidationService).to.exist;
    });

    it('creates a ETH request from payee', async () => {
        const role = Types.Role.Payee;
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );
        
        expect(request.requestId).to.exist;
        expect(request.currency).to.equal(Types.Currency.ETH);
        
        const requestData = await request.getData();
        expect(requestData.creator).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.address).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.balance.toNumber()).to.equal(0);
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(examplePayees[0].expectedAmount);
        expect(requestData.payer).to.equal(examplePayer.idAddress);
        expect(requestData.subPayees.length).to.equal(0);
    });

    it('creates a ETH request from payer', async () => {
        const role = Types.Role.Payer;
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );
        
        expect(request.requestId).to.exist;
        expect(request.currency).to.equal(Types.Currency.ETH);
        
        const requestData = await request.getData();
        expect(requestData.creator).to.equal(examplePayer.idAddress);
        expect(requestData.payee.address).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.balance.toNumber()).to.equal(0);
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(examplePayees[0].expectedAmount + examplePayees[0].additional);
        expect(requestData.payer).to.equal(examplePayer.idAddress);
        expect(requestData.subPayees.length).to.equal(0);
    });

    it('creates a ETH request with data', async () => {
        const role = Types.Role.Payer;
        const initialData = { message: 'Hello, human, I come in peace' };
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.ETH,
            examplePayees,
            examplePayer,
            { data: initialData }
        )
        
        const requestData = await request.getData();
        expect(requestData.data.data).to.deep.equal(initialData);
    });

    it('allows to pay an ETH request', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        await request.pay([1]);

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(1);
    });

    it('allows to create and pay an ETH request in 1 call', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payer,
            Types.Currency.ETH,
            [{
                idAddress: accounts[0],
                paymentAddress: accounts[0],
                additional: 5,
                expectedAmount: 100,
                amountToPayAtCreation: 100
            }],
            examplePayer,
        );

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(100);
    });

    it('allows to pay an ETH request using string and bignumbers', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        await request.pay([1]);
        await request.pay(['10']);
        await request.pay([new BigNumber(100)]);

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(111);
    });

    it('allows to accept an ETH request', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        await request.accept({ from: examplePayer.idAddress });

        const data = await request.getData();
        expect(data.state).to.equal(Types.State.Accepted);
    });

    it('allows to cancel an ETH request', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        await request.cancel();

        const data = await request.getData();
        expect(data.state).to.equal(Types.State.Canceled);
    });

    it('allows to refund an ETH request', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        await request.pay([10]);
        await request.refund(1);

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(9);
    });

    it('can increaseExpectedAmounts', async () => {
        const role = Types.Role.Payer;
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        const initialAmount = examplePayees[0].expectedAmount + examplePayees[0].additional;
        
        let requestData = await request.getData();
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(initialAmount);
        
        await request.increaseExpectedAmounts([15], { from: examplePayer.idAddress });
        requestData = await request.getData();
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(initialAmount + 15);
    });

    it('can reduceExpectedAmounts', async () => {
        const role = Types.Role.Payee;
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        const initialAmount = examplePayees[0].expectedAmount;
        
        let requestData = await request.getData();
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(initialAmount);
        
        await request.reduceExpectedAmounts([15]);
        requestData = await request.getData();
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(initialAmount - 15);
    });
    
    it('sends broadcasted event', async () => {
        const broadcastedSpy = chai.spy();
        const notCalledSpy = chai.spy();

        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        )
            .on('broadcasted', broadcastedSpy)
            .on('event-that-doesnt-exist', notCalledSpy);

        expect(request).to.be.an.instanceof(Request)
        expect(broadcastedSpy).to.have.been.called();
        expect(notCalledSpy).to.have.been.called.below(1);
    });
    
    it('gets request from its ID', async () => {
        const { request: request1 } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        const request2 = await requestNetwork.fromRequestId(request1.requestId);

        // Same ID
        expect(request1.requestId).to.equal(request1.requestId);

        // Different obejct referrences
        expect(request1).to.not.equal(request2);
    });
    
    it('gets data of a request', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        const data = await request.getData();

        expect(data.creator).to.be.equal(examplePayees[0].idAddress);
        expect(data.requestId).to.be.equal(request.requestId);
    });
    
    it('gets request from its txHash', async () => {
        const { transaction } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        const { request } = await requestNetwork.fromTransactionHash(transaction.hash);

        expect(request).to.exist;
    });

    it('creates a signed request', async () => {
        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            Date.now() + 3600*1000
        );

        expect(signedRequest).to.be.instanceof(SignedRequest);
        expect(signedRequest.signedRequestData.signature).to.exist;
    });

    it('checks validity of a signed request', async () => {
        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            Date.now() + 3600*1000
        );

        expect(signedRequest.isValid(examplePayer)).to.be.true;
        
        // Change the hash to make the signed request invalid
        signedRequest.signedRequestData.hash = 'someinvalidhash';
        expect(signedRequest.isValid(examplePayer)).to.be.false;
        expect(signedRequest.getInvalidErrorMessage(examplePayer)).to.be.equal('hash is not valid');
    });

    it('broadcasts a signed request', async () => {
        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            Date.now() + 3600*1000
        );

        const { request } = await requestNetwork.broadcastSignedRequest(signedRequest, examplePayer);

        expect(request.requestId).to.exist;
        expect(request.currency).to.equal(Types.Currency.ETH);
    });

    it('send broadcast event when broadcasting a signed request', async () => {
        const broadcastedSpy = chai.spy();
        const notCalledSpy = chai.spy();

        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            Date.now() + 3600*1000
        );

        const { request } = await requestNetwork.broadcastSignedRequest(signedRequest, examplePayer)
            .on('broadcasted', broadcastedSpy)
            .on('event-that-doesnt-exist', notCalledSpy);

        expect(request).to.be.an.instanceof(Request)
        expect(broadcastedSpy).to.have.been.called();
        expect(notCalledSpy).to.have.been.called.below(1);
    });

    it('can serialize and deserialize signed request', async () => {
        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            Date.now() + 3600*1000
        );

        const serialized = signedRequest.serializeForUri();
        const deserialized = new SignedRequest(serialized);

        expect(deserialized.signedRequestData.signature).to.equal(signedRequest.signedRequestData.signature);
    });

    it('can get events', async () => {
        const { request } = await requestNetwork.createRequest(
            Types.Role.Payer,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        const events = await request.getHistory();

        expect(events[0].name).to.equal('Created');
        expect(events[0].data.payee).to.equal(examplePayees[0].idAddress);
    });

    it('creates a ERC20 request from payee and pay it', async () => {
        const role = Types.Role.Payee;
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.REQ,
            examplePayees,
            examplePayer
        );

        expect(request.requestId).to.exist;
        expect(request.currency).to.equal(Types.Currency.REQ);
        
        const requestData = await request.getData();
        expect(requestData.creator).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.address).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.balance.toNumber()).to.equal(0);
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(examplePayees[0].expectedAmount);
        expect(requestData.payer).to.equal(examplePayer.idAddress);
        expect(requestData.subPayees.length).to.equal(0);

        // Send test tokens to the payer
        const testToken = new Erc20Service(currencyUtils.erc20TokenAddress(Types.Currency.REQ, 'private'));
        await testToken.transfer(examplePayer.idAddress, 1, { from: accounts[0] });        

        // Approve Request for the ERC20
        await requestNetwork.requestERC20Service.approveTokenForRequest(request.requestId, 100, { from: examplePayer.idAddress });

        await request.pay([1], [], { from: examplePayer.idAddress });

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(1);
    });

    it('broadcasts a ERC20 signed request', async () => {
        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.REQ,
            examplePayees,
            Date.now() + 3600*1000
        );

        const { request } = await requestNetwork.broadcastSignedRequest(signedRequest, examplePayer);

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(0);
    });

    it('creates a Bitcoin request from payee', async () => {
        const examplePayeesBTC = [{
            idAddress: accounts[0],
            paymentAddress: 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs',
            additional: 5,
            expectedAmount: 100,
        }];
        const examplePayerBTC = {
            idAddress: accounts[1],
            bitcoinRefundAddresses: ['mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9'],
        };

        const role = Types.Role.Payee;
        const { request } = await requestNetwork.createRequest(
            role,
            Types.Currency.BTC,
            examplePayeesBTC,
            examplePayerBTC
        );

        expect(request.requestId).to.exist;
        expect(request.currency).to.equal(Types.Currency.BTC);
        
        const requestData = await request.getData();
        expect(requestData.creator).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.address).to.equal(examplePayees[0].idAddress);
        expect(requestData.payee.balance.toNumber()).to.equal(0);
        expect(requestData.payee.expectedAmount.toNumber()).to.equal(examplePayees[0].expectedAmount);
        expect(requestData.payer).to.equal(examplePayer.idAddress);
        expect(requestData.subPayees.length).to.equal(0);
    });

    it('broadcasts a BTC signed request', async () => {
        const examplePayeesBTC = [{
            idAddress: accounts[0],
            paymentAddress: 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs',
            additional: 5,
            expectedAmount: 100,
        }];
        const examplePayerBTC = {
            idAddress: accounts[1],
            bitcoinRefundAddresses: ['mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9'],
        };

        const signedRequest = await requestNetwork.createSignedRequest(
            Types.Role.Payee,
            Types.Currency.BTC,
            examplePayeesBTC,
            Date.now() + 3600*1000
        );

        const { request } = await requestNetwork.broadcastSignedRequest(signedRequest, examplePayerBTC);

        const data = await request.getData();
        expect(data.payee.balance.toNumber()).to.equal(0);
    });

    it('propagates rejected promises', async () => {
        const catchSpy = chai.spy();

        const { request } = await requestNetwork.createRequest(
            Types.Role.Payee,
            Types.Currency.ETH,
            examplePayees,
            examplePayer
        );

        try {
            await request.pay([-1]);
        }
        catch (error) {
            expect(error).to.exist;
            catchSpy();
        }

        expect(catchSpy).to.have.been.called();
    });

    it('offers the number of decimals for a currency', () => {
        expect(utils.decimalsForCurrency(Types.Currency.DGX)).to.equal(9);
    });
});
