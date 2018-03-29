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

	it("Payee REVERT fund sending => REVERT", async function () {
		var r = await requestEthereum.createRequestAsPayer([testRequestPaymentStuckRevert.address], [arbitraryAmount], 0, [0], [0], "", {from:payer});
		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer}));
	});

	it("Payee ASSERT fund sending => REVERT", async function () {
		var r = await requestEthereum.createRequestAsPayer([testRequestPaymentStuckAssert.address], [arbitraryAmount], 0, [0], [0], "", {from:payer});
		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer}));
	});

	it("Payee non payable fund sending => REVERT", async function () {
		var r = await requestEthereum.createRequestAsPayer([testRequestPaymentStuckNonPayable.address], [arbitraryAmount], 0, [0], [0], "", {from:payer});
		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer}));
	});
});

