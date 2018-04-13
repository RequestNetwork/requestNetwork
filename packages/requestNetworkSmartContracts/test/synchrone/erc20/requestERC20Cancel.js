var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

// contract for test

var BigNumber = require('bignumber.js');

contract('RequestERC20 Cancel',  function(accounts) {
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
		await testToken.transfer(payee, arbitraryAmount, {from:payerRefund});

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
	// ### cancel by payer test unit #############################################################################
	// ##################################################################################################
	it("cancel by payer if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Canceled","Event Canceled is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Canceled wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],2,"new request wrong data : state");
	});

	it("cancel by payer request Ethereum pause impossible", async function () {
		await requestERC20.pause({from:admin});
		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});

	it("cancel by payer request not exist impossible", async function () {
		await utils.expectThrow(requestERC20.cancelAction(666, {from:payer}));
	});

	it("cancel by payer request from a random guy impossible", async function () {
		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:burnerContract}));
	});

	it("cancel by payer request already accepted impossible", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});
	it("cancel by payer request canceled impossible", async function () {
		await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payer}));
	});


	it("cancel by payer request created OK", async function () {
		var r = await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Canceled","Event Canceled is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Canceled wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],2,"new request wrong data : state");
	});

	it("cancel by payer request created OK - untrusted currencyContract", async function () {
		await requestCore.adminRemoveTrustedCurrencyContract(requestERC20.address, {from:admin});
		var r = await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Canceled","Event Canceled is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Canceled wrong args requestId");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],2,"new request wrong data : state");
	});




	it("cancel request payee balance != 0 Impossible", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [10], [], {from:payerRefund});
		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
	});

	it("cancel request subPayee balance != 0 Impossible", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [0,0,10], [], {from:payerRefund});
		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
	});

	it("cancel request subPayee balance != 0 (but total balance == 0) Impossible", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [0,0,10], [], {from:payerRefund});

		await testToken.approve(requestERC20.address, 10, {from:payee});
		await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), 10, {from:payee});

		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
	});

	it("cancel accepted request subPayee balance != 0 (but total balance == 0) Impossible", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [0,0,10], [], {from:payerRefund});

		await testToken.approve(requestERC20.address, 10, {from:payee});
		await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), 10, {from:payee});

		await utils.expectThrow(requestERC20.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
	});	

	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################

});

