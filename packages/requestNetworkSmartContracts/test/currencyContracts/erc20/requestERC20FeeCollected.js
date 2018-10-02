var config = require("../../config.js");
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

var timeExpiration;

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

contract('RequestERC20 Fee collected', function(accounts) {
  var admin = accounts[0];
	var burnerContract = accounts[1];

	var payerRefund = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var payeePayment = accounts[5];

	var requestCore;
	var requestERC20;
	var testToken;

  var minterAmount = '1000000000000000000';
	var arbitraryAmount = 1000000000000000;


  beforeEach(async () => {
		timeExpiration = (new Date("01/01/2222").getTime() / 1000);
    testToken = await TestToken.new(payer, minterAmount);
		requestCore = await RequestCore.new();
		requestERC20 = await RequestERC20.new(requestCore.address, burnerContract, testToken.address, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(requestERC20.address, {from:admin});
    await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether
	});

  it("fee collected when creating as payee", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestERC20.collectEstimation(arbitraryAmount);
    var r = await requestERC20.createRequestAsPayeeAction(
						[payee],
						[payeePayment],
						[arbitraryAmount],
						payer,
						payerRefund,
						"",
						{from:payee, value:fee});

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected when creating as payee');
  });

	it("fee collected when creating as payer", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestERC20.collectEstimation(arbitraryAmount);
		await testToken.approve(requestERC20.address, arbitraryAmount, {from:payer});
		var r = await requestERC20.createRequestAsPayerAction(
						[payee],
						[arbitraryAmount],
						payerRefund,
						[arbitraryAmount],
						[],
						"",
						{from:payer, value:fee});

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected when creating as payer');
  });

	it("fee collected when using signed request", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestERC20.collectEstimation(arbitraryAmount);

		var hash = hashRequest(requestERC20.address, [payee], [arbitraryAmount], [payeePayment], 0, "", timeExpiration);
		var signature = await signHashRequest(hash, payee);

		await testToken.approve(requestERC20.address, [arbitraryAmount], {from:payer});
		var r = await requestERC20.broadcastSignedRequestAsPayerAction(
						createBytesRequest([payee], [arbitraryAmount], 0, ""),
						[payeePayment],
						[arbitraryAmount],
						[],
						timeExpiration,
						signature,
						{from:payer, value:fee})

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected when using signed request');
  });
});
