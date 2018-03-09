var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}
var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
// contract for test
var TestRequestPaymentStuckRevert = artifacts.require("./test/synchrone/TestRequestPaymentStuckRevert.sol");
var TestRequestPaymentStuckAssert = artifacts.require("./test/synchrone/TestRequestPaymentStuckAssert.sol");
var TestRequestPaymentStuckNonPayable = artifacts.require("./test/synchrone/TestRequestPaymentStuckNonPayable.sol");

contract('RequestEthereum Payment stuck',  function(accounts) {
	var admin = accounts[0];
	var hacker = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var burnerContract = accounts[8];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount10percent = 100;
	var testRequestPaymentStuckRevert;
	var testRequestPaymentStuckAssert;

    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});

		
		
    	requestEthereum = await RequestEthereum.new(requestCore.address, burnerContract, {from:admin});
    	testRequestPaymentStuckRevert = await TestRequestPaymentStuckRevert.new({from:payee});
    	testRequestPaymentStuckAssert = await TestRequestPaymentStuckAssert.new({from:payee});
    	testRequestPaymentStuckNonPayable = await TestRequestPaymentStuckNonPayable.new({from:payee});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    });

	it("Payee REVERT fund sending => withdraw pattern", async function () {
		var r = await requestEthereum.createRequestAsPayer([testRequestPaymentStuckRevert.address], [arbitraryAmount], 0, [0], [0], "", {from:payer});

		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestEthereum.abi);
		assert.equal(l.name,"EtherAvailableToWithdraw","Event EtherAvailableToWithdraw is missing after paymentAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event EtherAvailableToWithdraw wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),testRequestPaymentStuckRevert.address,"Event EtherAvailableToWithdraw wrong args recipient");
		assert.equal(l.data[0],arbitraryAmount,"Event EtherAvailableToWithdraw wrong args amount");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[3],testRequestPaymentStuckRevert.address,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var r = await requestEthereum.ethToWithdraw.call(testRequestPaymentStuckRevert.address);
		assert(r,arbitraryAmount,"new request wrong data : amount to withdraw payee");

	});

	it("Payee ASSERT fund sending => withdraw pattern", async function () {
		var r = await requestEthereum.createRequestAsPayer([testRequestPaymentStuckAssert.address], [arbitraryAmount], 0, [0], [0], "", {from:payer});

		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestEthereum.abi);
		assert.equal(l.name,"EtherAvailableToWithdraw","Event EtherAvailableToWithdraw is missing after paymentAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event EtherAvailableToWithdraw wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),testRequestPaymentStuckAssert.address,"Event EtherAvailableToWithdraw wrong args recipient");
		assert.equal(l.data[0],arbitraryAmount,"Event EtherAvailableToWithdraw wrong args amount");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],testRequestPaymentStuckAssert.address,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var r = await requestEthereum.ethToWithdraw.call(testRequestPaymentStuckAssert.address);
		assert(r,arbitraryAmount,"new request wrong data : amount to withdraw payee");

	});

	it("Payee non payable fund sending => withdraw pattern", async function () {
		var r = await requestEthereum.createRequestAsPayer([testRequestPaymentStuckNonPayable.address], [arbitraryAmount], 0, [0], [0], "", {from:payer});

		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestEthereum.abi);
		assert.equal(l.name,"EtherAvailableToWithdraw","Event EtherAvailableToWithdraw is missing after paymentAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event EtherAvailableToWithdraw wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),testRequestPaymentStuckNonPayable.address,"Event EtherAvailableToWithdraw wrong args recipient");
		assert.equal(l.data[0],arbitraryAmount,"Event EtherAvailableToWithdraw wrong args amount");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],testRequestPaymentStuckNonPayable.address,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var r = await requestEthereum.ethToWithdraw.call(testRequestPaymentStuckNonPayable.address);
		assert(r,arbitraryAmount,"new request wrong data : amount to withdraw payee");

	});
});

