var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}

var ethUtil = require("ethereumjs-util");

// var ethABI = require("ethereumjs-abi");
// waiting for Solidity pack Array support (vrolland did a pull request)
var ethABI = require("../../../lib/ethereumjs-abi-perso.js"); 

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol");

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

contract('RequestBitcoinNodesValidation broadcastSignedRequestAsPayerAction',  function(accounts) {
    var admin = accounts[0];
    var burnerContract = accounts[1];

    var payer = accounts[3];
    var payee = accounts[4];
    var payee2 = accounts[5];
    var payee3 = accounts[6];

    var payeePayment = accounts[7];
    var payee2Payment = accounts[8];
    var payee3Payment = accounts[9];

    var requestCore;
    var requestBitcoinNodesValidation;

    var arbitraryAmount = 1000;
    var arbitraryAmount10percent = 100;
    var arbitraryAmount20percent = 200;
    var arbitraryAmount2 = 2000;
    var arbitraryAmount3 = 300;

    var payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
    var payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
    var payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';
    var payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
    var payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
    var payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';

    var timeExpiration;

    beforeEach(async () => {
        timeExpiration = (new Date("01/01/2222").getTime() / 1000);
        requestCore = await RequestCore.new();
        requestBitcoinNodesValidation = await RequestBitcoinNodesValidation.new(requestCore.address, burnerContract, {from:admin});
        
        await requestCore.adminAddTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});
    });

    it("can broadcast request with tips", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [arbitraryAmount10percent];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        
        var r = await requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                        createBytesRequest(payees, expectedAmounts, 0, data),
                        utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                        utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                        additionals,
                        timeExpiration,
                        signature,
                        {from:payer});

        assert.equal(r.receipt.logs.length, 4, "Wrong number of events");
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

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");       
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"can broadcast request wrong data : currencyContract");
        assert.equal(newReq[2],1,"can broadcast request wrong data : state");
        assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"can broadcast request wrong data : expectedAmount");
        assert.equal(newReq[5],0,"can broadcast request wrong data : amountPaid");

        var r = await requestBitcoinNodesValidation.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),0);   
        assert.equal(r,payeePayment,"wrong payeesPaymentAddress 2");

        var r = await requestBitcoinNodesValidation.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),1);   
        assert.equal(r,payee2Payment,"wrong payeesPaymentAddress 2");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),0);
        assert.equal(r,payeeRefund,"wrong payeeRefund");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),1);
        assert.equal(r,payee2Refund,"wrong payee2Refund");
    });

    it("can broadcast request without tips", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        
        var r = await requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                        createBytesRequest(payees, expectedAmounts, 0, data),
                        utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                        utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                        additionals,
                        timeExpiration,
                        signature,
                        {from:payer});

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");       
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"can broadcast request wrong data : currencyContract");
        assert.equal(newReq[2],1,"can broadcast request wrong data : state");
        assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
        assert.equal(newReq[4],arbitraryAmount,"can broadcast request wrong data : expectedAmount");
        assert.equal(newReq[5],0,"can broadcast request wrong data : amountPaid");
    });

    it("cannot broadcast request if payee==payer", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        
        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payee}));
    });

    it("cannot broadcast request if payee==0", async function () {
        var payees = [0, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        
        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("cannot broadcast if Core Paused", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        await requestCore.pause({from:admin});
        
        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("can broadcast request signed by payer", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payer);
        
        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("cannot broadcast request signed by otherguy", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,burnerContract);
        
        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("cannot broadcast request signature that does not match data", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);
        
        payeesPayment[0] = 'mg5AMpbvbKU6D6k3eUe4XXXXXXXXXXXXXX';

        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("cannot broadcast request when currencyContract not trusted", async function () {
        var requestBitcoinNodesValidation2 = await RequestBitcoinNodesValidation.new(requestCore.address,{from:admin});
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation2.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);
        
        await utils.expectThrow(requestBitcoinNodesValidation2.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("cannot broadcast request expired", async function () {
        timeExpiration = (new Date().getTime() / 1000) - 60;

        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        await utils.expectThrow(requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                    createBytesRequest(payees, expectedAmounts, 0, data),
                                    utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                    utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                    additionals,
                                    timeExpiration,
                                    signature,
                                    {from:payer}));
    });

    it("can broadcast request with fees", async function () {
        var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
        await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
        await requestBitcoinNodesValidation.setMaxCollectable('10000000000000000', {from:admin}); // 0.01 ether

        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment, payee3Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [arbitraryAmount10percent];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        var fees = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount + arbitraryAmount2);
    
        var r = await requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                createBytesRequest(payees, expectedAmounts, 0, data),
                                utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                additionals,
                                timeExpiration,
                                signature,
                                {from:payer, value:fees});

        assert.equal(r.receipt.logs.length,4,"Wrong number of events");

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

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
        assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");       
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"can broadcast request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"can broadcast request wrong data : currencyContract");
        assert.equal(newReq[5],0,"can broadcast request wrong data : amountPaid");
        assert.equal(newReq[2],1,"can broadcast request wrong data : state");

        assert((await web3.eth.getBalance(burnerContract)).sub(balanceBurnerContractBefore).equals(fees),"new request wrong data : amount to burnerContract");  
    });

    it("cannot broadcast request if msg.value < fees", async function () {
        var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
        await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
        await requestBitcoinNodesValidation.setMaxCollectable('10000000000000000', {from:admin}); // 0.01 ether

        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment, payee3Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        var fees = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount + arbitraryAmount2);
    
        await utils.expectThrow (requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                createBytesRequest(payees, expectedAmounts, 0, data),
                                utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                additionals,
                                timeExpiration,
                                signature,
                                {from:payer, value:fees.sub(1)}));
    });
    
    it("cannot broadcast request if msg.value > fees", async function () {
        var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
        await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
        await requestBitcoinNodesValidation.setMaxCollectable('10000000000000000', {from:admin}); // 0.01 ether

        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment, payee3Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        var fees = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount + arbitraryAmount2);
    
        await utils.expectThrow (requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                                createBytesRequest(payees, expectedAmounts, 0, data),
                                utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                                utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                                additionals,
                                timeExpiration,
                                signature,
                                {from:payer, value:fees.add(1)}));
    });

    it("can broadcast request with more payees payment (extra are ignored)", async function () {
        var payees = [payee, payee2];
        var payeesPayment = [payeePayment, payee2Payment, payee3Payment];
        var expectedAmounts = [arbitraryAmount, arbitraryAmount2];
        var payeesRefund = [payeeRefund, payee2Refund];
        var additionals = [];
        var data = "";

        var hash = hashRequest(requestBitcoinNodesValidation.address, payees, expectedAmounts, payeesPayment, 0, data, timeExpiration);
        var signature = await signHashRequest(hash,payee);

        
        var r = await requestBitcoinNodesValidation.broadcastSignedRequestAsPayerAction(
                        createBytesRequest(payees, expectedAmounts, 0, data),
                        utils.createBytesForPaymentBitcoinAddress(payeesPayment),
                        utils.createBytesForPaymentBitcoinAddress(payeesRefund),
                        additionals,
                        timeExpiration,
                        signature,
                        {from:payer});

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[0],payer,"can broadcast request wrong data : payer");       
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"can broadcast request wrong data : currencyContract");
        assert.equal(newReq[2],1,"can broadcast request wrong data : state");
        assert.equal(newReq[3],payee,"can broadcast request wrong data : payee");
        assert.equal(newReq[4],arbitraryAmount,"can broadcast request wrong data : expectedAmount");
        assert.equal(newReq[5],0,"can broadcast request wrong data : amountPaid");
    });

});
