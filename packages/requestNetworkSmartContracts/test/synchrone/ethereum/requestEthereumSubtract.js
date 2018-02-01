var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");
var BigNumber = require('bignumber.js');

contract('RequestEthereum SubtractAction',  function(accounts) {
	var admin = accounts[0];
	var otherGuy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount10percent = 100;

    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
    	requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var newRequest = await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		
    });

	// ##################################################################################################
	// ### Accept test unit #############################################################################
	// ##################################################################################################
	it("discount if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
	});

	it("discount request not exist impossible", async function () {
		await utils.expectThrow(requestEthereum.subtractAction(666, arbitraryAmount10percent, {from:payee}));
	});

	it("discount request just created OK", async function () {
		var r = await requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
	});

	it("discount request just created OK - untrusted currencyContract", async function () {
		await requestCore.adminRemoveTrustedCurrencyContract(requestEthereum.address, {from:admin});
		var r = await requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
	});

	it("discount by payee request canceled impossible", async function () {
		await requestEthereum.cancel(utils.getRequestId(requestCore.address, 1), {from:payee});
		await utils.expectThrow(requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee}));
	});

	it("discount request from a random guy Impossible", async function () {
		await utils.expectThrow(requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:otherGuy}));
	});

	it("discount request from payer Impossible", async function () {
		await utils.expectThrow(requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payer}));
	});

	it("discount request accepted OK", async function () {
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		var r = await requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],1,"new request wrong data : state");
	});

	it("discount request with amount > expectedAmount Impossible", async function () {
		await utils.expectThrow(requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount+1, {from:payee}));
	});

	it("discount request with amount <= expectedAmountAfterAddSub - amountPaid OK", async function () {
		var r = await requestEthereum.subtractAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount, {from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount,"Event UpdateExpectedAmount wrong args amount");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],0,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
	});

});

