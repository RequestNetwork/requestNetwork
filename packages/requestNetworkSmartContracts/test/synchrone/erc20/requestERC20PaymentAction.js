var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

var BigNumber = require('bignumber.js');

contract('RequestERC20 PaymentAction', function(accounts) {
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
	var arbitraryTips = 10000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount20percent = 2000;
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
	// ### Pay test unit #############################################################################
	// ##################################################################################################
	it("can pay request", async function () {
		var balancePayeeBefore = await testToken.balanceOf(payeePayment);
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payerRefund,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await testToken.balanceOf(payeePayment)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to payee");
	});

	it("can pay request if core is paused", async function () {
		var balancePayeeBefore = await testToken.balanceOf(payeePayment);
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});

		await requestCore.pause({from:admin});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payerRefund,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await testToken.balanceOf(payeePayment)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to payee");
	});

	it("cannot pay request ether if requestEther is paused", async function () {
		await requestERC20.pause({from:admin});

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund}));
	});

	it("cannot pay request ether if no token is approved to the contract", async function () {
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund}));
	});

	it("cannot pay request ether if not enough token is approved to the contract", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount2, {from:payerRefund});
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund}));
	});

	it("pay request not exist impossible", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount2, {from:payerRefund});
		await utils.expectThrow(requestERC20.paymentAction(666, [arbitraryAmount], [], {from:payerRefund}));
	});


	it("pay request by payer just created => accept auto", async function () {
		await requestERC20.createRequestAsPayeeAction(
							
							[payee,payee2,payee3],
							[payeePayment,payee2Payment,payee3Payment],
							[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
							payer,
							payerRefund,
							"",
							{from:payee});

		await testToken.transfer(payer, arbitraryAmount, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 2), [arbitraryAmount], [], {from:payer});

		assert.equal(r.receipt.logs.length,3,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayeeAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayeeAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 2));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");
	});


	it("pay request by otherguy just created => ok", async function () {
		await requestERC20.createRequestAsPayeeAction(
					
					[payee,payee2,payee3],
					[payeePayment,payee2Payment,payee3Payment],
					[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
					payer,
					payerRefund,
					"",
					{from:payee});

		await testToken.transfer(burnerContract, arbitraryAmount, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:burnerContract});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 2), [arbitraryAmount], [], {from:burnerContract});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),burnerContract,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 2));
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[2],0,"new request wrong data : state");
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
	});

	it("pay request canceled impossible", async function () {
		await requestERC20.createRequestAsPayeeAction(
			
			[payee,payee2,payee3],
			[payeePayment,payee2Payment,payee3Payment],
			[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
			payer,
			payerRefund,
			"",
			{from:payee});
		await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 2), {from:payee});

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 2), [arbitraryAmount], [], {from:payerRefund}));
	});

	it("pay request from payee OK", async function () {
		await testToken.transfer(payee, arbitraryAmount, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payee});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
	});

	it("pay request from payer OK - untrusted currencyContract", async function () {
		await requestCore.adminRemoveTrustedCurrencyContract(requestERC20.address, {from:admin});

		var balancePayeeBefore = await testToken.balanceOf(payeePayment);
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payerRefund,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await testToken.balanceOf(payeePayment)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to payee");
	});

	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################
	it("msg.value == 0 OK", async function () {
		var balancePayeeBefore = await testToken.balanceOf(payeePayment);
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});

		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [0], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,0,"Wrong number of events");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");
	});

	it("3 pay request ", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount+arbitraryAmount2+arbitraryAmount3, {from:payerRefund});

		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount3], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount3,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payerRefund,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount3,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount3,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		// second
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount2], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount2,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payerRefund,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount2,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount3+arbitraryAmount2,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		// third
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payerRefund,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount3+arbitraryAmount2+arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
	});

	it("pay by otherguy with tips Impossible", async function () {
		await testToken.transfer(burnerContract, arbitraryAmount, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:burnerContract});
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [arbitraryTips], {from:burnerContract}));
	});

	it("pay by payer with tips OK", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});

		await testToken.transfer(payer, arbitraryAmount, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [arbitraryTips], {from:payer});

		assert.equal(r.receipt.logs.length,3,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryTips,"Event UpdateExpectedAmount wrong args amountAdditional");

		l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]),payeePayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+arbitraryTips,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");
	});



	it("cannot pay request with more amounts than expected", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount,arbitraryAmount2,arbitraryAmount3,arbitraryAmount], [], {from:payerRefund}));
	});

	it("cannot pay request with more additionals than expected", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		await utils.expectThrow(requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3,arbitraryAmount], {from:payerRefund}));
	});
});

