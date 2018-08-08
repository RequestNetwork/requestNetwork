var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

// contract for test
var BigNumber = require('bignumber.js');

contract('RequestERC20 Accept',  function(accounts) {
	var admin = accounts[0];
	var burnerContract = accounts[1];

	var payerRefund = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];

	var payeePayment = accounts[7];
	var payee2Payment = accounts[8];
	var payee3Payment = accounts[9];

	var requestCore;
	var requestERC20;
	var testToken;

	var minterAmount = '1000000000000000000';
	var arbitraryAmount = 100000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount3 = 30000;

	beforeEach(async () => {
		testToken = await TestToken.new(payerRefund, minterAmount);
		requestCore = await RequestCore.new({from:admin});

		requestERC20 = await RequestERC20.new(requestCore.address, burnerContract, testToken.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestERC20.address, {from:admin});
		

		await requestERC20.createRequestAsPayeeAction(
							[payee,payee2,payee3],
							[payeePayment,payee2Payment,payee3Payment],
							[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
							payer,
							payerRefund,
							"",
							{from:payee});
	});

	// ##################################################################################################
	// ### Accept test unit #############################################################################
	// ##################################################################################################
	it("accept if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");
	});

	it("accept request ERC20 pause impossible", async function () {
		await requestERC20.pause({from:admin});
		await utils.expectThrow(requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});

	it("accept request not exist impossible", async function () {
		await utils.expectThrow(requestERC20.acceptAction(666, {from:payer}));
	});

	it("accept request from a random guy impossible", async function () {
		await utils.expectThrow(requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:burnerContract}));
	});
	it("accept request from payee impossible", async function () {
		await utils.expectThrow(requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
	});

	it("accept by payer request already accepted Impossible", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		await utils.expectThrow(requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});

	it("accept by payee request canceled impossible", async function () {
		await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
		await utils.expectThrow(requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});


	it("accept request currencyContract untrusted - accept OK", async function () {
		await requestCore.adminRemoveTrustedCurrencyContract(requestERC20.address, {from:admin});
		
		var r = await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		
		
		assert.equal(newReq[2],1,"new request wrong data : state");
	});


	it("accept request created OK", async function () {
		var r = await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		
		
		assert.equal(newReq[2],1,"new request wrong data : state");
	});

	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################

});

