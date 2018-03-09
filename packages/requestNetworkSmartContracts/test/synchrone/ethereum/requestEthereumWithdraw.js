var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}
var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");

// contract for test
var TestRequestReentrancy = artifacts.require("./test/synchrone/TestRequestReentrancy.sol");


contract('RequestEthereum Withdraw',  function(accounts) {
	var admin = accounts[0];
	var hacker = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var hacker2 = accounts[5];
	var payee2 = accounts[6];
	var payee3 = accounts[7];
	var burnerContract = accounts[8];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount2 = 200;
	var arbitraryAmount3 = 300; 
	var arbitraryAmount10percent = 100;
	var testRequestReentrancy;

    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});

		
		
    	requestEthereum = await RequestEthereum.new(requestCore.address, burnerContract, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var newRequest = await requestEthereum.createRequestAsPayee([payee,payee2,payee3], [], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, 0, "", {from:payee});
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
    });

	// ##################################################################################################
	// ### withdraw test unit ###########################################################################
	// ##################################################################################################
	it("challenge reentrancy 2 rounds", async function () {
		await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {from:payer,value:arbitraryAmount});
		testRequestReentrancy = await TestRequestReentrancy.new(requestEthereum.address, 2,{from:hacker});
		var r = await testRequestReentrancy.init(hacker, {from:hacker2});
		assert.equal(r.logs[0].event,"Log","Event Log is missing");
		assert.equal(r.logs[0].args.id,utils.getRequestId(requestCore.address, 2),"Event Payment wrong args id");
		await requestEthereum.accept(r.logs[0].args.id, {from:hacker});
		await requestEthereum.paymentAction(r.logs[0].args.id, [arbitraryAmount10percent], [0], {from:hacker,value:arbitraryAmount10percent});
		var r = await utils.expectThrow(testRequestReentrancy.start({from:hacker}));
		assert.equal(await web3.eth.getBalance(testRequestReentrancy.address), 0, 'Contract hacking balance must remain 0');
	});


});

