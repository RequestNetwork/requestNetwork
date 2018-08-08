var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

var BigNumber = require('bignumber.js');


contract('RequestERC20 PayBack',  function(accounts) {
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
	var arbitraryAmount10percent = 10000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount20percent = 2000;
	var arbitraryAmount3 = 30000;
	var arbitraryAmount30percent = 3000;


	beforeEach(async () => {
		testToken = await TestToken.new(payerRefund, minterAmount);
		await testToken.transfer(payee, minterAmount/2, {from:payerRefund});

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

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payerRefund});
		var r = await requestERC20.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [], {from:payerRefund});
  });

	// ##################################################################################################
	// ##################################################################################################

	it("can refund request just created ok", async function () {
		await requestERC20.createRequestAsPayeeAction(
					
					[payee,payee2,payee3],
					[payeePayment,payee2Payment,payee3Payment],
					[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
					payer,
					payerRefund,
					"",
					{from:payee});

		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		var r =await requestERC20.refundAction(utils.getRequestId(requestCore.address, 2), arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 2));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

	});

	it("can refund if Core Paused OK", async function () {
		await requestCore.pause({from:admin});

		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		var r =await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
	});

	it("can refund with no refund address", async function () {
		await requestERC20.createRequestAsPayeeAction(
					
					[payee,payee2,payee3],
					[payeePayment,payee2Payment,payee3Payment],
					[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
					payer,
					0,
					"",
					{from:payee});

		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		var r =await requestERC20.refundAction(utils.getRequestId(requestCore.address, 2), arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payer,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 2));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
	});


	it("can refund request Ethereum pause impossible", async function () {
		await requestERC20.pause({from:admin});

		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		await utils.expectThrow(requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee}));
	});
	
	it("can refund request not exist impossible", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		await utils.expectThrow(requestERC20.refundAction(666, arbitraryAmount10percent, {from:payee}));
	});

	it("can refund request canceled impossible", async function () {
		await requestERC20.createRequestAsPayeeAction(
			
			[payee,payee2,payee3],
			[payeePayment,payee2Payment,payee3Payment],
			[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
			payer,
			payerRefund,
			"",
			{from:payee});

		await requestERC20.cancelAction(utils.getRequestId(requestCore.address, 2), {from:payee});
		await utils.expectThrow(requestERC20.refundAction(utils.getRequestId(requestCore.address, 2), arbitraryAmount10percent, {from:payee}));
	});

	it("can refund request from payer Impossible", async function () {
		await utils.expectThrow(requestERC20.refundAction(utils.getRequestId(requestCore.address, 2), arbitraryAmount10percent, {from:payer}));
	});

	it("can refund request from a random guy Impossible", async function () {
		await utils.expectThrow(requestERC20.refundAction(utils.getRequestId(requestCore.address, 2), arbitraryAmount10percent, {from:burnerContract}));
	});


	it("can refund request accepted OK", async function () {
		await requestERC20.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");
	});


	it("can refund request accepted OK - untrusted currencyContract", async function () {
		await requestCore.adminRemoveTrustedCurrencyContract(requestERC20.address, {from:admin});
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");		
		assert.equal(newReq[2],0,"new request wrong data : state");
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################

	it("msg.value == 0 OK", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), 0, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],0,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],0,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");		
		assert.equal(newReq[2],0,"new request wrong data : state");
	});

	it("can refund request 3 times", async function () {
		await testToken.approve(requestERC20.address, arbitraryAmount30percent, {from:payee});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:payee});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount30percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount30percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent,"new request wrong data : balance");		
		assert.equal(newReq[2],0,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");


		// second
		await testToken.transfer(payee2, arbitraryAmount20percent, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount20percent, {from:payee2});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount20percent, {from:payee2});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount20percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee2,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount20percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent,"new request wrong data : balance");		
		assert.equal(newReq[2],0,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount20percent,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		// third
		await testToken.transfer(payee3, arbitraryAmount10percent, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee3});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee3});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],2,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee3,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount20percent,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount10percent,"new request wrong data : balance");
	});	

	it("refund by subPayeeId OK", async function () {
		await testToken.transfer(payee2, arbitraryAmount10percent, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee2});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee2});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee2,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount10percent,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

	});

	it("refund by subPayeePayment OK", async function () {
		await testToken.transfer(payee2Payment, arbitraryAmount10percent, {from:payerRefund});
		await testToken.approve(requestERC20.address, arbitraryAmount10percent, {from:payee2Payment});
		var r = await requestERC20.refundAction(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:payee2Payment});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after refundAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[1]),payee2Payment,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]),payerRefund,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount10percent,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");
	});

});

