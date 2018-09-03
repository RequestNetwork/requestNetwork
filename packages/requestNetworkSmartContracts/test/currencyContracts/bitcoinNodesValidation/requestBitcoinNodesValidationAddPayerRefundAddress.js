var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}


var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol");


var BigNumber = require('bignumber.js');


contract('RequestBitcoinNodesValidation createRequestAsPayeeAction',  function(accounts) {
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
        requestCore = await RequestCore.new();

        requestBitcoinNodesValidation = await RequestBitcoinNodesValidation.new(requestCore.address, burnerContract, {from:admin});

        await requestCore.adminAddTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});
    });

   it("cannot add payment refund address if already given at the creation", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee});

        await utils.expectThrow(requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                          utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                                          {from:payer}));
        
    });

   it("cannot add payment refund address if already given with the same function", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([]),
                                                "", 
                                                {from:payee});
        

        var r = await requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                          utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                                          {from:payer});

        await utils.expectThrow(requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                          utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                                          {from:payer}));
        
    });


    it("can add payment refund address", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([]),
                                                "", 
                                                {from:payee});


        var r = await requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                          utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                                          {from:payer});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestBitcoinNodesValidation.abi);
        assert.equal(l.name,"RefundAddressAdded","Event RefundAddressAdded is missing after addPayerRefundAddressAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event RefundAddressAdded wrong args requestId");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),0);
        assert.equal(r,payeeRefund,"wrong payeeRefund");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),1);
        assert.equal(r,payee2Refund,"wrong payee2Refund");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),2);
        assert.equal(r,payee3Refund,"wrong payee3Refund");
    });

    it("cannot add refund address with address missing", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([]),
                                                "", 
                                                {from:payee});


        await utils.expectThrow(requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                                  utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund]),
                                                                                  {from:payer}));
    });


    it("cannot add refund address by payee", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([]),
                                                "", 
                                                {from:payee});


        await utils.expectThrow(requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                                  utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Payment]),
                                                                                  {from:payee}));
    });


    it("cannot add refund address by other guy", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([]),
                                                "", 
                                                {from:payee});


        await utils.expectThrow(requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                                  utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                                                  {from:admin}));
    });
    
    it("impossible to createRequest if Core Paused", async function () {
        await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([]),
                                                "", 
                                                {from:payee});

        await requestBitcoinNodesValidation.pause({from:admin});

        await utils.expectThrow(requestBitcoinNodesValidation.addPayerRefundAddressAction(utils.getRequestId(requestCore.address, 1), 
                                                                                  utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                                                  {from:payer}));
    });

});

