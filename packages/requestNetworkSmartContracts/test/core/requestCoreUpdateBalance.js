var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");

var BigNumber = require('bignumber.js');
var BN = require('bn.js');

contract('RequestCore UpdateBalance', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var creator = accounts[5];
	var fakeContract2 = accounts[6];

	var arbitraryAmount = 100000000;
	var arbitraryAmount10percent = 10000000;
	var arbitraryAmount20percent = 20000000;
	var arbitraryAmount30percent = 30000000;
	var arbitraryAmount40percent = 40000000;

	var requestCore;
	var newRequest;

    beforeEach(async () => {
		requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(fakeContract2, {from:admin});

		var newRequest = await requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {from:fakeContract});
    })

	// ##################################################################################################
	// ### updateBalance with positive amount test unit #############################################################################
	// ##################################################################################################
	// updateBalance with positive amount request already accepted OK
	it("updateBalance with positive amount request accepted OK - check event log and request status", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(r[6],1,"new request wrong data : state");
	});

	// updateBalance with positive amount request already canceled OK
	it("updateBalance with positive amount request canceled OK - check event log and request status", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],2,"new request wrong data : state");
	});

	it("updateBalance with positive amount if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateBalance with positive amount request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(2, arbitraryAmount10percent, {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 2), {from:fakeContract});
		assert.equal(r[0],0,"request wrong data : creator");
		assert.equal(r[1],0,"request wrong data : payee");
		assert.equal(r[2],0,"request wrong data : payer");
		assert.equal(r[3],0,"request wrong data : expectedAmount");
		assert.equal(r[4],0,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateBalance with positive amount request from a random guy impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:otherguy}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateBalance with positive amount request from other subcontract impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract2}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});


	it("new updateBalance with positive amount _amount==0 OK", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,0,"Event UpdateBalance wrong args balance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateBalance with positive amount _amount >= 2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), new BigNumber(2).pow(256), {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	// seems buggy -> issue on truffle
	// it("new updateBalance with positive amount _amount+request.amounPaid > 2^255 (overflow) impossible", async function () {
		
	// 	var n = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), new BigNumber(2).pow(254), {from:fakeContract});

	// 	await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), new BigNumber(2).pow(254), {from:fakeContract}));

	// 	var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));

	// 	assert.equal(r[0],creator,"request wrong data : creator");
	// 	assert.equal(r[1],payee,"request wrong data : payee");
	// 	assert.equal(r[2],payer,"request wrong data : payer");
	// 	assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
	// 	assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
	// 	assert.equal(new BigNumber(2).pow(254).comparedTo(r[5]),0,"new request wrong data : balance");
	// 	assert.equal(r[6],0,"new request wrong data : state");
	// });


	it("new updateBalance with positive amount _amount+request.amounPaid == expectedAmount-request.amountSubtract+request.amountAdditional", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount,"Event UpdateBalance wrong args balance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateBalance with positive amount _amount+request.amounPaid > expectedAmount-request.amountSubtract+request.amountAdditional", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount*2, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount*2,"Event UpdateBalance wrong args balance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount*2,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################


	// ##################################################################################################
	// ### updateBalance with negative amount test unit #############################################################################
	// ##################################################################################################
	it("updateBalance with negative amount request created OK - check event log and request status", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});
	// updateBalance with negative amount request already accepted OK
	it("updateBalance with negative amount request accepted OK - check event log and request status", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});

		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],1,"new request wrong data : state");
	});

	// updateBalance with negative amount request already canceled OK
	it("updateBalance with negative amount request canceled OK - check event log and request status", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});

		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],2,"new request wrong data : state");
	});

	it("updateBalance with negative amount if Core Paused OK", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});
		await requestCore.pause({from:admin});

		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateBalance with negative amount request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 2), -arbitraryAmount10percent, {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 2), {from:fakeContract});
		assert.equal(r[0],0,"request wrong data : creator");
		assert.equal(r[1],0,"request wrong data : payee");
		assert.equal(r[2],0,"request wrong data : payer");
		assert.equal(r[3],0,"request wrong data : expectedAmount");
		assert.equal(r[4],0,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateBalance with negative amount request from a random guy impossible", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:otherguy}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount30percent,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateBalance with negative amount request from other subcontract impossible", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract2}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount30percent,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});


	// new updateBalance with negative amount _amount <= -2^256 impossible
	it("new updateBalance with negative amount _amount <= -2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), new BigNumber(-2).pow(256), {from:fakeContract}));
		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});

		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateBalance with negative amount r.amounPaid - _amount < 0 OK", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -1, {from:fakeContract});

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],-1,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateBalance with negative amount r.amounPaid - _amount == 0 OK", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount30percent, {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount30percent, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount30percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateBalance with negative amount after a other updateBalance with negative amount", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), arbitraryAmount40percent, {from:fakeContract});
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), -arbitraryAmount20percent, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################


});


