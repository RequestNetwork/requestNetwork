var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

var BigNumber = require('bignumber.js');

contract('RequestERC20 createRequestAsPayee',  function(accounts) {
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
		requestCore = await RequestCore.new();
		requestERC20 = await RequestERC20.new(requestCore.address, burnerContract, testToken.address, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(requestERC20.address, {from:admin});
	});

	it("new request OK", async function () {
		var r = await requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,payee2Payment,payee3Payment],
										[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee});

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args subPayee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args subPayee");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(r[2],0,"new request wrong data : state");
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[5],0,"new request wrong data : balance");

		var count = await requestCore.getSubPayeesCount.call(utils.getRequestId(requestCore.address,1));
		assert.equal(count,2,"number of subPayee wrong");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r,payeePayment,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r,payee2Payment,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),2);	
		assert.equal(r,payee3Payment,"wrong payeesPaymentAddress 3");

		var r = await requestERC20.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r,payerRefund,"wrong payerRefundAddress");
	});

	it("new request second payee without payment address", async function () {
		var r = await requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,0,payee3Payment],
										[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee});

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args subPayee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args subPayee");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(r[2],0,"new request wrong data : state");
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[5],0,"new request wrong data : balance");

		var count = await requestCore.getSubPayeesCount.call(utils.getRequestId(requestCore.address,1));
		assert.equal(count,2,"number of subPayee wrong");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r,payeePayment,"wrong payeesPaymentAddress 1");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r,0,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),2);	
		assert.equal(r,payee3Payment,"wrong payeesPaymentAddress 3");

		var r = await requestERC20.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r,payerRefund,"wrong payerRefundAddress");
	});

	it("new request with negative amount", async function () {
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,0,payee3Payment],
										[arbitraryAmount,-1,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee}));
	});

	it("basic check on payee payer", async function () {
		// new request payer==0
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
								[payee,payee2,payee3],
								[payeePayment,0,payee3Payment],
								[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
								0,
								payerRefund,
								"",
								{from:payee}));

		// new request payee==payer impossible
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
								[payee,payee2,payee3],
								[payeePayment,0,payee3Payment],
								[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
								0,
								payerRefund,
								"",
								{from:payee}));
	});

	it("basic check on expectedAmount", async function () {
		// new request _expectedAmount >= 2^256 impossible
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
						[payee,payee2,payee3],
						[payeePayment,0,payee3Payment],
						[new BigNumber(2).pow(256),arbitraryAmount2,arbitraryAmount3],
						payer,
						payerRefund,
						"",
						{from:payee}));
	});

	it("impossible to createRequest if Core Paused", async function () {
		await requestCore.pause({from:admin});
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
				[payee,payee2,payee3],
				[payeePayment,0,payee3Payment],
				[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
				payer,
				payerRefund,
				"",
				{from:payee}));
	});

	it("new request when currencyContract not trusted Impossible", async function () {
		var requestERC202 = await RequestERC20.new(requestCore.address, burnerContract, testToken.address, {from:admin});
		await utils.expectThrow(requestERC202.createRequestAsPayeeAction(
			[payee,payee2,payee3],
			[payeePayment,0,payee3Payment],
			[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
			payer,
			payerRefund,
			"",
			{from:payee}));
	});

	it("new request with fees", async function () {
		// 0.1% fees & 0.002 ether max
		await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('2000000000000000', {from:admin}); // 0.01 ether

		var fees = await requestERC20.collectEstimation(arbitraryAmount+arbitraryAmount2+arbitraryAmount3);
		var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);

		var r = await requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,payee2Payment,payee3Payment],
										[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee, value:fees});

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args subPayee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args subPayee");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(r[2],0,"new request wrong data : state");
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[5],0,"new request wrong data : balance");

		var count = await requestCore.getSubPayeesCount.call(utils.getRequestId(requestCore.address,1));
		assert.equal(count,2,"number of subPayee wrong");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r,payeePayment,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r,payee2Payment,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),2);	
		assert.equal(r,payee3Payment,"wrong payeesPaymentAddress 3");

		var r = await requestERC20.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r,payerRefund,"wrong payerRefundAddress");

		assert((await web3.eth.getBalance(burnerContract)).sub(balanceBurnerContractBefore).equals(fees),"new request wrong data : amount to burnerContract");
	});

	it("impossible to createRequest if msg.value < fees", async function () {
		// 0.1% fees & 0.002 ether max
		await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether

		var fees = await requestERC20.collectEstimation(arbitraryAmount+arbitraryAmount2+arbitraryAmount3);
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,payee2Payment,payee3Payment],
										[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee, value:fees-1}));
	});

	it("impossible to createRequest if msg.value > fees", async function () {
		// 0.1% fees & 0.002 ether max
		await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether

		var fees = await requestERC20.collectEstimation(arbitraryAmount+arbitraryAmount2+arbitraryAmount3);
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,payee2Payment,payee3Payment],
										[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee, value:fees+1}));
	});

	it("impossible change fees if not admin", async function () {
		// 0.1% fees & 0.002 ether max
		await utils.expectThrow(requestERC20.setRateFees(1, 1000, {from:payee})); // 0.1%
		await utils.expectThrow(requestERC20.setMaxCollectable('2000000000000000', {from:payee})); // 0.002 ether
	});

	it("impossible change maxCollectable if not admin", async function () {
		await utils.expectThrow(requestERC20.setMaxCollectable(10000000,{from:payee})); 
	});

	it("new request with more amounts than payees Impossible", async function () {
		await utils.expectThrow(requestERC20.createRequestAsPayeeAction(
			[payee,payee2,payee3],
			[payeePayment,0,payee3Payment],
			[arbitraryAmount,arbitraryAmount2,arbitraryAmount3,arbitraryAmount3],
			payer,
			payerRefund,
			"",
			{from:payee}));
	});	

	it("new request with more payment address than payees OK (extra ignored)", async function () {
		var r = await requestERC20.createRequestAsPayeeAction(
										[payee,payee2,payee3],
										[payeePayment,payee2Payment,payee3Payment,payee3Payment],
										[arbitraryAmount,arbitraryAmount2,arbitraryAmount3],
										payer,
										payerRefund,
										"",
										{from:payee});

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args subPayee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args subPayee");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(r[2],0,"new request wrong data : state");
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[5],0,"new request wrong data : balance");

		var count = await requestCore.getSubPayeesCount.call(utils.getRequestId(requestCore.address,1));
		assert.equal(count,2,"number of subPayee wrong");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r,payeePayment,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r,payee2Payment,"wrong payeesPaymentAddress 2");

		var r = await requestERC20.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),2);	
		assert.equal(r,payee3Payment,"wrong payeesPaymentAddress 3");

		var r = await requestERC20.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r,payerRefund,"wrong payerRefundAddress");
	});

});

