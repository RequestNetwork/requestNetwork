var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");

// contract for test

contract('RequestEthereum Accept',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var burnerContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount2 = 1000;
	var arbitraryAmount3 = 1000;

    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});

		
    	requestEthereum = await RequestEthereum.new(requestCore.address, burnerContract, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		await requestEthereum.createRequestAsPayee([payee,payee2,payee3], [], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, 0, "", {from:payee})
    });

	// ##################################################################################################
	// ### Accept test unit #############################################################################
	// ##################################################################################################
	it("accept if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");
	});

	it("accept request Ethereum pause impossible", async function () {
		await requestEthereum.pause({from:admin});
		await utils.expectThrow(requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});

	it("accept request not exist impossible", async function () {
		await utils.expectThrow(requestEthereum.accept(666, {from:payer}));
	});

	it("accept request from a random guy impossible", async function () {
		await utils.expectThrow(requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:otherguy}));
	});
	it("accept request from payee impossible", async function () {
		await utils.expectThrow(requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payee}));
	});

	it("accept by payer request already accepted Impossible", async function () {
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		await utils.expectThrow(requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});

	it("accept by payee request canceled impossible", async function () {
		await requestEthereum.cancel(utils.getRequestId(requestCore.address, 1), {from:payee});
		await utils.expectThrow(requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});


	it("accept request currencyContract untrusted - accept OK", async function () {
		await requestCore.adminRemoveTrustedCurrencyContract(requestEthereum.address, {from:admin});
		
		var r = await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		
		
		assert.equal(newReq[2],1,"new request wrong data : state");
	});


	it("accept request created OK", async function () {
		var r = await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		
		
		assert.equal(newReq[2],1,"new request wrong data : state");
	});

	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################

});

