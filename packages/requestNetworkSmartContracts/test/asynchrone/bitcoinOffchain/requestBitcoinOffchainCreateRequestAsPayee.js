var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}


var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol");


var BigNumber = require('bignumber.js');


contract('RequestBitcoinNodesValidation createRequestAsPayee',  function(accounts) {
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

    it("new request OK", async function () {
        var r = await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee});
        
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayeeAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
        assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
        assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
        assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
        assert.equal(l.data[1],'',"Event Created wrong args data");

        var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
        assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayeeAction()");
        assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
        assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args subPayee");

        var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
        assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayeeAction()");
        assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
        assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args subPayee");

        var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(r[0],payer,"request wrong data : payer");
        assert.equal(r[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
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

        var r = await requestBitcoinNodesValidation.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),0);   
        assert.equal(r,payeePayment,"wrong payeesPaymentAddress 2");

        var r = await requestBitcoinNodesValidation.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),1);   
        assert.equal(r,payee2Payment,"wrong payeesPaymentAddress 2");

        var r = await requestBitcoinNodesValidation.payeesPaymentAddress.call(utils.getRequestId(requestCore.address, 1),2);   
        assert.equal(r,payee3Payment,"wrong payeesPaymentAddress 3");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),0);
        assert.equal(r,payeeRefund,"wrong payeeRefund");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),1);
        assert.equal(r,payee2Refund,"wrong payee2Refund");

        var r = await requestBitcoinNodesValidation.payerRefundAddress.call(utils.getRequestId(requestCore.address, 1),2);
        assert.equal(r,payee3Refund,"wrong payee3Refund");
    });

    it("new request with address missing", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                        [payee,payee2,payee3],
                                                        utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment]), 
                                                        [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                        payer, 
                                                        utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                        "", 
                                                        {from:payee}));


        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                        [payee,payee2,payee3],
                                                        utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                        [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                        payer, 
                                                        utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund]),
                                                        "", 
                                                        {from:payee}));

    });

    it("new request with negative amount", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [-1,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee}));
    });

    it("basic check on payee payer", async function () {
        // new request payer==0 impossible
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                0, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee}));
        // new request payee==payer impossible
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payee, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee}));
    });

    it("basic check on expectedAmount", async function () {
        // new request _expectedAmount >= 2^256 impossible
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [new BigNumber(2).pow(256),arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee}));
    });

    it("impossible to createRequest if Core Paused", async function () {
        await requestCore.pause({from:admin});
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee}));
    });

    it("new request when currencyContract not trusted Impossible", async function () {
        var requestBitcoinNodesValidation2 = await RequestBitcoinNodesValidation.new(requestCore.address,{from:admin});
        await utils.expectThrow(requestBitcoinNodesValidation2.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee}));
    });


    it("new request with fees", async function () {
        // 0.1% fees & 0.002 ether max
        await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
        await requestBitcoinNodesValidation.setMaxCollectable('2000000000000000', {from:admin});

        var fees = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount+arbitraryAmount2+arbitraryAmount3);
        var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);

        var r = await requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee,value: fees});
        
        assert((await web3.eth.getBalance(burnerContract)).sub(balanceBurnerContractBefore).equals(fees),"new request wrong data : amount to burnerContract");
    });

    it("impossible to createRequest if msg.value < fees", async function () {
        // 0.1% fees & 0.002 ether max
        await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
        await requestBitcoinNodesValidation.setMaxCollectable('2000000000000000', {from:admin});

        var fees = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount+arbitraryAmount2+arbitraryAmount3);
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee,value: fees-1}));
    });
    
    it("impossible to createRequest if msg.value > fees", async function () {
        // 0.1% fees & 0.002 ether max
        await requestBitcoinNodesValidation.setRateFees(1, 1000, {from:admin}); // 0.1%
        await requestBitcoinNodesValidation.setMaxCollectable('2000000000000000', {from:admin});

        var fees = await requestBitcoinNodesValidation.collectEstimation(arbitraryAmount+arbitraryAmount2+arbitraryAmount3);
        await utils.expectThrow(requestBitcoinNodesValidation.createRequestAsPayeeAction(
                                                [payee,payee2,payee3],
                                                utils.createBytesForPaymentBitcoinAddress([payeePayment,payee2Payment,payee3Payment]), 
                                                [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 
                                                payer, 
                                                utils.createBytesForPaymentBitcoinAddress([payeeRefund,payee2Refund,payee3Refund]),
                                                "", 
                                                {from:payee,value: fees+1}));
    });


    it("impossible change fees if not admin", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.setRateFees(1,10000,{from:payee})); 
    });
    it("impossible change maxCollectable if not admin", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.setMaxCollectable('2000000000000000',{from:payee})); 
    });

});

