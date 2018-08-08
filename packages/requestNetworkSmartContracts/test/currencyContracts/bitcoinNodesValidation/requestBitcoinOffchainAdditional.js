var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol")

var BigNumber = require('bignumber.js');

contract('RequestBitcoinNodesValidation AdditionalAction',  function(accounts) {
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

    var arbitraryAmount = 10000;
    var arbitraryAmount10percent = 1000;
    var arbitraryAmount20percent = 2000;
    var arbitraryAmount30percent = 3000;
    var arbitraryAmount2 = 2000;
    var arbitraryAmount3 = 3000;

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
    // ### Accept test unit #############################################################################
    // ##################################################################################################
    it("can make additionals if Core Paused", async function () {
        await requestCore.pause({from:admin});
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payer});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after additionalAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("cannot make additionals if request does not exist", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(666, [arbitraryAmount10percent], {from:payer}));
    });

    it("can make additionals on request just created", async function () {
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payer});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after additionalAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("can make additionals request with the currencyContract untrusted", async function () {
        await requestCore.adminRemoveTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payer});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after additionalAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("cannot make additionals on request canceled", async function () {
        await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount10percent], {from:payer}));
    });

    it("cannot make additionals on request from a random guy", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount10percent], {from:burnerContract}));
    });

    it("cannot make additionals on request from payee", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount10percent], {from:payee}));
    });

    it("cannot make negative additionals on main payee", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1), [-1], {from:payer}));
    });

    it("cannot make negative additionals on sub payee", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1), [0, -1], {from:payer}));
    });

    it("can make additionals on accepted request", async function () {
        await requestBitcoinNodesValidation.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payer});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after additionalAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],1,"new request wrong data : state");
    });

    it("can make additionals with amount > expectedAmount", async function () {
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount+1], {from:payer});

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount+1,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("can make additionals with amount <= expectedAmount", async function () {
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount], {from:payer});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after additionalAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount,"Event UpdateExpectedAmount wrong args amount");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount+arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("can make additionals on subPayees", async function () {
        var r = await requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[0,arbitraryAmount10percent,arbitraryAmount20percent], {from:payer});
        assert.equal(r.receipt.logs.length,2,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],1,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],2,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],arbitraryAmount20percent,"Event UpdateExpectedAmount wrong args amount");
        
        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");

        var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0); 
        assert.equal(r[0],payee2,"request wrong data : payer");
        assert.equal(r[1],arbitraryAmount2+arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(r[2],0,"new request wrong data : balance");

        var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1); 
        assert.equal(r[0],payee3,"request wrong data : payer");
        assert.equal(r[1],arbitraryAmount3+arbitraryAmount20percent,"new request wrong data : expectedAmount");
        assert.equal(r[2],0,"new request wrong data : balance");
    });

    it("cannot make additionals on more subPayees than expected", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.additionalAction(utils.getRequestId(requestCore.address, 1),[0,arbitraryAmount10percent,arbitraryAmount20percent,arbitraryAmount30percent], {from:payer}));
    });
});

