var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var ethUtil = require("ethereumjs-util");

// var ethABI = require("ethereumjs-abi");
// waiting for Solidity pack Array support (vrolland did a pull request)
var ethABI = require("../../../lib/ethereumjs-abi-perso.js"); 

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

var BigNumber = require('bignumber.js');

var hashRequest = function(contract, payees, expectedAmounts, _payeesPayment, payer, data, expirationDate) {
	let requestParts = [
	{value: contract, type: "address"},
	{value: payees[0], type: "address"},
	{value: payer, type: "address"},
	{value: payees.length, type: "uint8"}];

	for (k in payees) {
		requestParts.push({value: payees[k], type: "address"})
		requestParts.push({value: expectedAmounts[k], type: "int256"})
	}

	requestParts.push({value: data.length, type: "uint8"});
	requestParts.push({value: data, type: "string"});

	requestParts.push({value: _payeesPayment, type: "address[]"});
	requestParts.push({value: expirationDate, type: "uint256"});

	var types = [];
	var values = [];
	requestParts.forEach(function(o,i) {
		types.push(o.type);
		values.push(o.value);
	});
	return ethABI.soliditySHA3(types, values);
}

var createBytesRequest = function(payees, expectedAmounts, payer, data) {
	let requestParts = [
	{value: payees[0], type: "address"},
	{value: payer, type: "address"},
	{value: payees.length, type: "uint8"}];

	for (k in payees) {
		requestParts.push({value: payees[k], type: "address"})
		requestParts.push({value: expectedAmounts[k], type: "int256"})
	}

	requestParts.push({value: data.length, type: "uint8"});
	requestParts.push({value: data, type: "string"});

	var types = [];
	var values = [];
	requestParts.forEach(function(o,i) {
		types.push(o.type);
		values.push(o.value);
	});
	return ethUtil.bufferToHex(ethABI.solidityPack(types, values));
}

var signHashRequest = function (hash, address) {
	return web3.eth.sign(address, ethUtil.bufferToHex(hash));
}

contract('RequestERC20 broadcastSignedRequestAsPayerAction',  function(accounts) {
	var admin = accounts[0];
	var payerRefund = accounts[1];
	var burnerContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];
	var payeeAddressPayment = accounts[7];
	var payee2AddressPayment = accounts[8];
	var payee3AddressPayment = accounts[9];

	var requestCore;
	var requestERC20;

	var minterAmount = '1000000000000000000';
	var arbitraryAmount = 100000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount3 = 30000;
	var arbitraryAmount10percent = 100;

	var timeExpiration;

	beforeEach(async () => {
		timeExpiration = (new Date("01/01/2222").getTime() / 1000);
		testToken = await TestToken.new(payer, minterAmount);
		requestCore = await RequestCore.new();
		requestERC20 = await RequestERC20.new(requestCore.address, burnerContract, testToken.address, {from:admin});
		
		await requestCore.adminAddTrustedCurrencyContract(requestERC20.address, {from:admin});
	});

	it("can broadcast request with tips", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer});

		assert.equal(r.receipt.logs.length, 6, "Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[4], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[4].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[5], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[5].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[5].topics[2]),payee,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");		
		assert.equal(newReq[1],requestERC20.address,"can broadcast request wrong data : currencyContract");
		assert.equal(newReq[2],1,"can broadcast request wrong data : state");
		assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"can broadcast request wrong data : expectedAmount");
		assert.equal(newReq[5],arbitraryAmount,"can broadcast request wrong data : amountPaid");
	});

	it("can broadcast request without tips", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer});

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");		
		assert.equal(newReq[1],requestERC20.address,"can broadcast request wrong data : currencyContract");
		assert.equal(newReq[2],1,"can broadcast request wrong data : state");
		assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
		assert.equal(newReq[4],arbitraryAmount,"can broadcast request wrong data : expectedAmount");
		assert.equal(newReq[5],arbitraryAmount,"can broadcast request wrong data : amountPaid");
	});

	it("cannot broadcast request if payee==payer", async function () {
		var payees = [payer, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast request if payee==0", async function () {
		var payees = [0, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast if Core Paused", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";
		
		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await requestCore.pause({from:admin});

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("can broadcast request signed by payer", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payer);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast request signed by otherguy", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash, burnerContract);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast request signature that does not match data", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash, payee);

		payeesPayment[0] = burnerContract;

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast request when currencyContract not trusted", async function () {
		var requestERC202 = await RequestERC20.new(requestCore.address,{from:admin});
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC202.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash, payee);

		await testToken.approve(requestERC202.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC202.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast request expired", async function () {
		timeExpiration = (new Date().getTime() / 1000) - 60;

		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash, payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("can broadcast request from payer with 3 payees all paid with tips with payments addresses", async function () {
		var payees = [payee, payee2, payee3];
		var payeesPayment = [payeeAddressPayment,payee2AddressPayment,payee3AddressPayment];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2,arbitraryAmount3];
		var payeeAmounts = [arbitraryAmount+1,arbitraryAmount2+2,arbitraryAmount3+3];
		var additionals = [1,2,3];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount+arbitraryAmount2+arbitraryAmount3+6, {from:payer});
		var r = await requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer});

		assert.equal(r.receipt.logs.length,13,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[4], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[4].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],1,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[5], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[5].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],2,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[6], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[6].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],2,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],3,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[7], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[7].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[8], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[8].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[8].topics[2]),payeeAddressPayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount+1,"Event Transfer wrong args value");

		var l = utils.getEventFromReceipt(r.receipt.logs[9], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[9].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount2+2,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[10], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[10].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[10].topics[2]),payee2AddressPayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount2+2,"Event Transfer wrong args value");

		var l = utils.getEventFromReceipt(r.receipt.logs[11], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[11].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],2,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount3+3,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[12], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[12].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[12].topics[2]),payee3AddressPayment,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount3+3,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+1,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var count = await requestCore.getSubPayeesCount.call(utils.getRequestId(requestCore.address,1));
		assert.equal(count,2,"number of subPayee wrong");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2+2,"new request wrong data : expectedAmount");
		assert.equal(r[2],arbitraryAmount2+2,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3+3,"new request wrong data : expectedAmount");
		assert.equal(r[2],arbitraryAmount3+3,"new request wrong data : balance");
	});

	it("can broadcast request more than expectedAmount", async function () {
		var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
		await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('10000000000000000', {from:admin}); // 0.01 ether

		var fees = await requestERC20.collectEstimation(arbitraryAmount + arbitraryAmount2);
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount+arbitraryAmount2, {from:payer});
		var r = await requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer, value:fees});

		assert.equal(r.receipt.logs.length,6,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[4], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayerAction()");
		assert.equal(r.receipt.logs[4].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[5], testToken.abi);
		assert.equal(l.name,"Transfer","Event Transfer is missing after paymentAction()");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[5].topics[1]),payer,"Event Transfer wrong args from");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[5].topics[2]),payee,"Event Transfer wrong args to");
		assert.equal(l.data[0],arbitraryAmount,"Event Transfer wrong args value");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
		assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");		
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"can broadcast request wrong data : expectedAmount");
		assert.equal(newReq[1],requestERC20.address,"can broadcast request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"can broadcast request wrong data : amountPaid");
		assert.equal(newReq[2],1,"can broadcast request wrong data : state");

		assert((await web3.eth.getBalance(burnerContract)).sub(balanceBurnerContractBefore).equals(fees),"new request wrong data : amount to burnerContract");	
	});

	it("cannot broadcast request if msg.value < fees", async function () {
		var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
		await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('10000000000000000', {from:admin}); // 0.01 ether

		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var fees = await requestERC20.collectEstimation(arbitraryAmount + arbitraryAmount2);

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount+arbitraryAmount2, {from:payer});
		await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer, value:fees.minus(1)}));
	});
	
	it("cannot broadcast request if msg.value > fees", async function () {
		var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
		await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('10000000000000000', {from:admin}); // 0.01 ether

		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var fees = await requestERC20.collectEstimation(arbitraryAmount + arbitraryAmount2);

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount+arbitraryAmount2, {from:payer});
		await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer, value:fees.add(1)}));
	});

	it("cannot broadcast request without enough token approved", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount-1, {from:payer});
		await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("cannot broadcast request with more additionals than expected", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [];
		var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent,arbitraryAmount10percent,arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		await utils.expectThrow(requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer}));
	});

	it("can broadcast request with more payees payment (extra are ignored)", async function () {
		var payees = [payee, payee2];
		var payeesPayment = [payeeAddressPayment, payee2AddressPayment, payee3AddressPayment];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestERC20.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest(payees, expectedAmounts, 0, data),
						payeesPayment,
						payeeAmounts,
						additionals,
						timeExpiration,
						signature,
						{from:payer});

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");		
		assert.equal(newReq[1],requestERC20.address,"can broadcast request wrong data : currencyContract");
		assert.equal(newReq[2],1,"can broadcast request wrong data : state");
		assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
		assert.equal(newReq[4],arbitraryAmount,"can broadcast request wrong data : expectedAmount");
		assert.equal(newReq[5],arbitraryAmount,"can broadcast request wrong data : amountPaid");
	});
});
