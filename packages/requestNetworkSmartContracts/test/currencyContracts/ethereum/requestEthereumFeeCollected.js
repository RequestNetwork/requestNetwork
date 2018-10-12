var config = require("../../config.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var ethUtil = require("ethereumjs-util");

// var ethABI = require("ethereumjs-abi");
// waiting for Solidity pack Array support (vrolland did a pull request)
var ethABI = require("../../../lib/ethereumjs-abi-perso.js");

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");

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

contract('RequestEthereum Fee collected', function(accounts) {
  var admin = accounts[0];
	var burnerContract = accounts[1];

	var payerRefund = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var payeePayment = accounts[5];

	var requestCore;
	var requestEthereum;

	var arbitraryAmount = 1000000000000000;  // 0.001 ether


  beforeEach(async () => {
		timeExpiration = (new Date("01/01/2222").getTime() / 1000);
		requestCore = await RequestCore.new();
		requestEthereum = await RequestEthereum.new(requestCore.address, burnerContract, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    await requestEthereum.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestEthereum.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether
	});

  it("fee collected when creating as payee", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestEthereum.collectEstimation(arbitraryAmount);
    var r = await requestEthereum.createRequestAsPayeeAction(
						[payee],
						[payeePayment],
						[arbitraryAmount],
						payer,
						payerRefund,
						"",
						{from:payee, value:fee});

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected');
  });

	it("fee collected when creating as payer", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestEthereum.collectEstimation(arbitraryAmount);
		var r = await requestEthereum.createRequestAsPayerAction(
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
    var fee = await requestEthereum.collectEstimation(arbitraryAmount);

		var hash = hashRequest(requestEthereum.address, [payee], [arbitraryAmount], [payeePayment], 0, "", timeExpiration);
		var signature = await signHashRequest(hash, payee);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(
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
