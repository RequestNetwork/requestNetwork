var utils = require("../../utils.js");
var config = require("../../config.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var ethUtil = require("ethereumjs-util");

// var ethABI = require("ethereumjs-abi");
// waiting for Solidity pack Array support (vrolland did a pull request)
var ethABI = require("../../../lib/ethereumjs-abi-perso.js");

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol");

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

    requestParts.push({value: utils.createBytesForPaymentBitcoinAddressBuffer(_payeesPayment), type: "bytes"});
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

contract('RequestBitcoinNodesValidation Fee collected', function(accounts) {
  var admin = accounts[0];
	var burnerContract = accounts[1];

	var payer = accounts[2];
	var payee = accounts[3];

	var payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
	var payerRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';

	var requestCore;
	var requestBitcoinNodesValidation;

	var arbitraryAmount = 1000000000000000;


  beforeEach(async () => {
		timeExpiration = (new Date("01/01/2222").getTime() / 1000);
		requestCore = await RequestCore.new();
		requestBitcoinNodesValidation = await RequestBitcoinNodesValidation.new(requestCore.address, burnerContract, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});
    await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestBitcoinNodesValidation.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether
	});

  it("fee collected when creating as payee", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount);
    var r = await requestBitcoinNodesValidation.createRequestAsPayeeAction(
						[payee],
						utils.createBytesForPaymentBitcoinAddress([payeePayment]),
						[arbitraryAmount],
						payer,
						utils.createBytesForPaymentBitcoinAddress([payerRefund]),
						"",
						{from:payee, value:fee});

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected');
  });

	it("fee collected when using signed request", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount);

		var hash = hashRequest(requestBitcoinNodesValidation.address, [payee], [arbitraryAmount], [payeePayment], 0, "", timeExpiration);
		var signature = await signHashRequest(hash, payee);

		var r = await requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
						createBytesRequest([payee], [arbitraryAmount], 0, ""),
						utils.createBytesForPaymentBitcoinAddress([payeePayment]),
						utils.createBytesForPaymentBitcoinAddress([payerRefund]),
						[],
						timeExpiration,
						signature,
						{from:payer, value:fee});

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected when using signed request');
  });
});
