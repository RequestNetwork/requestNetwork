var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}
var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");

// contract for test
var TestRequestReentrance = artifacts.require("./test/synchrone/TestRequestReentrance.sol");
var BigNumber = require('bignumber.js');

contract('RequestEthereum Withdraw',  function(accounts) {
	var admin = accounts[0];
	var hacker = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var hacker2 = accounts[5];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount10percent = 100;
	var testRequestReentrance;

    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
    	requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var newRequest = await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
    });

	// ##################################################################################################
	// ### withdraw test unit ###########################################################################
	// ##################################################################################################
	it("challenge reentrance 2 rounds", async function () {
		await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), 0, {from:payer,value:arbitraryAmount});
		testRequestReentrance = await TestRequestReentrance.new(requestEthereum.address, 2,{from:hacker});
		
		var r = await testRequestReentrance.init(hacker,{from:hacker2});
		assert.equal(r.logs[0].event,"Log","Event Log is missing");
		assert.equal(r.logs[0].args.id,utils.getRequestId(requestCore.address, 2),"Event Payment wrong args id");

		await requestEthereum.accept(r.logs[0].args.id, {from:hacker});
		await requestEthereum.paymentAction(r.logs[0].args.id, 0, {from:hacker,value:arbitraryAmount10percent});
		var r = await utils.expectThrow(testRequestReentrance.start({from:hacker}));
		assert.equal(await web3.eth.getBalance(testRequestReentrance.address), 0, 'Contract hacking balance must remain 0');
	});


});

