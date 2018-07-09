var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol");

// contract for test

var BigNumber = require('bignumber.js');

contract('RequestBitcoinNodesValidation Cancel by payer',  function(accounts) {
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

    var arbitraryAmount = 100000;
    var arbitraryAmount2 = 20000;
    var arbitraryAmount3 = 30000;

    var payeePayment = 'mxp1Nmde8EyuB93YanAvQg8uSxzCs1iycs';
    var payee2Payment = 'mgUVRGCtdXd6PFKMmy2NsP6ENv2kajXaGV';
    var payee3Payment = 'n4jWwb24iQGPcBzPbXvhoE7N3CBCxWUE5y';
    var payeeRefund = 'mg5AMpbvbKU6D6k3eUe4R7Q4jbcFimPTF9';
    var payee2Refund = 'mqbRwd1488VLFdJfMQQyKis4RgHH6epcAW';
    var payee3Refund = 'mopMp1tpQzCXbXKLH9UVQxDoaDEjM76muv';


    beforeEach(async () => {
        requestCore = await RequestCore.new({from:admin});

        
        requestBitcoinNodesValidation = await RequestBitcoinNodesValidation.new(requestCore.address, burnerContract, {from:admin});

        await requestCore.adminAddTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});

        
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                [payee,payee2,payee3],
                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                payer, 
                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                "", 
                                {from:payee});
    });

    // ##################################################################################################
    // ### Cancel test unit #############################################################################
    // ##################################################################################################
    it("cancel if Core Paused OK", async function () {
        await requestCore.pause({from:admin});
        var r = await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"Canceled","Event Canceled is missing after cancel()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Canceled wrong args requestId");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],2,"new request wrong data : state");
    }); 

    it("cancel if untrusted currencyContract", async function () {
        await requestCore.adminRemoveTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});

        var r = await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"Canceled","Event Canceled is missing after cancel()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Canceled wrong args requestId");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],2,"new request wrong data : state");
    });

    it("cancel request ERC20 pause impossible", async function () {
        await requestBitcoinNodesValidation.pause({from:admin});
        await utils.expectThrow(requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
    });

    it("cancel request not exist impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.cancelAction(666, {from:payer}));
    });

    it("cancel request from a random guy impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:burnerContract}));
    });

    it("cancel by payee request canceled impossible", async function () {
        await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        await utils.expectThrow(requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee}));
    });

    it("cancel by payee request already accepted OK if amount == 0", async function () {
        await requestBitcoinNodesValidation.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
        await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],2,"new request wrong data : state");
    });

    it("cancel request created OK", async function () {
        var r = await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"Canceled","Event Canceled is missing after cancel()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Canceled wrong args requestId");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],2,"new request wrong data : state");
    });

    // ##################################################################################################
    // ##################################################################################################
    // ##################################################################################################
});

