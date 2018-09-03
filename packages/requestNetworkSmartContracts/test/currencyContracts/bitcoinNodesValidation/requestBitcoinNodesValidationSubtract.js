var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestBitcoinNodesValidation = artifacts.require("./synchrone/RequestBitcoinNodesValidation.sol");
var BigNumber = require('bignumber.js');

contract('RequestBitcoinNodesValidation SubtractAction',  function(accounts) {
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
    var arbitraryAmount10percent = 10000;
    var arbitraryAmount20percent = 20000;
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
    // ### Accept test unit #############################################################################
    // ##################################################################################################
    it("subtract if Core Paused OK", async function () {
        await requestCore.pause({from:admin});
        var r = await requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payee});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");
        
        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("subtract request not exist impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(666, [arbitraryAmount10percent], {from:payee}));
    });

    it("subtract request just created OK", async function () {
        var r = await requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payee});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("subtract request just created OK - untrusted currencyContract", async function () {
        await requestCore.adminRemoveTrustedCurrencyContract(requestBitcoinNodesValidation.address, {from:admin});
        var r = await requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payee});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");
        
        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });

    it("subtract by payee request canceled impossible", async function () {
        await requestBitcoinNodesValidation.cancelAction(utils.getRequestId(requestCore.address, 1), {from:payee});
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount10percent], {from:payee}));
    });

    it("subtract request from a random guy Impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount10percent], {from:burnerContract}));
    });

    it("subtract request from payer Impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount10percent], {from:payer}));
    });

    it("subtract request accepted OK", async function () {
        await requestBitcoinNodesValidation.acceptAction(utils.getRequestId(requestCore.address, 1), {from:payer});
        var r = await requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent], {from:payee});
        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");
        
        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));

        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],1,"new request wrong data : state");
    });

    it("subtract request with amount > expectedAmount Impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount+1], {from:payee}));
    });

    it("subtract request with amount > expectedAmount on subPayee Impossible", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[0, arbitraryAmount2+1], {from:payee}));
    });

    it("subtract request with amount <= expectedAmount OK", async function () {
        var r = await requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount], {from:payee});

        assert.equal(r.receipt.logs.length,1,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount,"Event UpdateExpectedAmount wrong args amount");
        
        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],0,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");
    });


    it("subtract subPayees", async function () {
        var r = await requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[0,arbitraryAmount10percent,arbitraryAmount20percent], {from:payee});
        assert.equal(r.receipt.logs.length,2,"Wrong number of events");
        var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],1,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

        var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
        assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after subtractAction()");
        assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
        assert.equal(l.data[0],2,"Event UpdateExpectedAmount wrong args payeeIndex");
        assert.equal(l.data[1],-arbitraryAmount20percent,"Event UpdateExpectedAmount wrong args amount");
        

        var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
        assert.equal(newReq[3],payee,"new request wrong data : payee");
        assert.equal(newReq[0],payer,"new request wrong data : payer");
        assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
        assert.equal(newReq[1],requestBitcoinNodesValidation.address,"new request wrong data : currencyContract");
        assert.equal(newReq[5],0,"new request wrong data : balance");
        assert.equal(newReq[2],0,"new request wrong data : state");

        var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0); 
        assert.equal(r[0],payee2,"request wrong data : payer");
        assert.equal(r[1],arbitraryAmount2-arbitraryAmount10percent,"new request wrong data : expectedAmount");
        assert.equal(r[2],0,"new request wrong data : balance");

        var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1); 
        assert.equal(r[0],payee3,"request wrong data : payer");
        assert.equal(r[1],arbitraryAmount3-arbitraryAmount20percent,"new request wrong data : expectedAmount");
        assert.equal(r[2],0,"new request wrong data : balance");
    });



    it("cannot subtract with more amounts than expected", async function () {
        await utils.expectThrow(requestBitcoinNodesValidation.subtractAction(utils.getRequestId(requestCore.address, 1),[arbitraryAmount10percent,arbitraryAmount10percent,arbitraryAmount10percent,arbitraryAmount10percent], {from:payee}));
    });
});

