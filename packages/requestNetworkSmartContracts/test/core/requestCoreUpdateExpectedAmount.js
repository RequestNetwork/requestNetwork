var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");

var BigNumber = require('bignumber.js');

contract('RequestCore updateExpectedAmount', function(accounts) {
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
	var arbitraryAmount60percent = 60000000;

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
	// ### updateExpectedAmount with positive delta test unit #############################################################################
	// ##################################################################################################
	it("updateExpectedAmount with positive delta on request created OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});
	// updateExpectedAmount with positive delta on request already accepted OK
	it("updateExpectedAmount with positive delta on request accepted OK", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],1,"new request wrong data : state");
	});

	// updateExpectedAmount request already canceled OK
	it("updateExpectedAmount request canceled OK", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],2,"new request wrong data : state");
	});

	it("updateExpectedAmount if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateExpectedAmount request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 2), arbitraryAmount10percent, {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 2), {from:fakeContract});
		assert.equal(r[0],0,"request wrong data : creator");
		assert.equal(r[1],0,"request wrong data : payee");
		assert.equal(r[2],0,"request wrong data : payer");
		assert.equal(r[3],0,"request wrong data : expectedAmount");
		assert.equal(r[4],0,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateExpectedAmount request from a random guy impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:otherguy}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("updateExpectedAmount request from other subcontract impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract2}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateExpectedAmount with negative amount after a other updateExpectedAmount with positive delta", async function () {
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), arbitraryAmount10percent, {from:fakeContract});

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount+arbitraryAmount20percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateExpectedAmount _amount==0 OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,0,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateExpectedAmount _amount >= 2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), new BigNumber(2).pow(256), {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});



	it("new updateExpectedAmount with positive delta balance + amountAdditional >= 2^256 (overflow) impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), new BigNumber(2).pow(256), {from:fakeContract}));
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################




	// ##################################################################################################
	// ### updateExpectedAmount with negative amount test unit #############################################################################
	// ##################################################################################################
	it("updateExpectedAmount with negative amount on request created OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});
	// updateExpectedAmount with negative amount on request already accepted OK
	it("updateExpectedAmount with negative amount on request accepted OK", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],1,"new request wrong data : state");
	});

	// updateExpectedAmount request already canceled OK
	it("updateExpectedAmount request canceled OK", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],2,"new request wrong data : state");
	});

	it("addSubtract if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
	});

	it("addSubtract request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 2), -arbitraryAmount10percent, {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 2), {from:fakeContract});
		assert.equal(r[0],0,"request wrong data : creator");
		assert.equal(r[1],0,"request wrong data : payee");
		assert.equal(r[2],0,"request wrong data : payer");
		assert.equal(r[3],0,"request wrong data : expectedAmount");
		assert.equal(r[4],0,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("addSubtract request from a random guy impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:otherguy}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("addSubtract request from other subcontract impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract2}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});


	it("new addSubtract _amount >= 2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), new BigNumber(-2).pow(256), {from:fakeContract}));

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	it("new updateExpectedAmount with negative amount after a other updateExpectedAmount with negative amount", async function () {
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount10percent, {from:fakeContract});

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount-arbitraryAmount20percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});

	// seems buggy -> issue on truffle
	// it("new updateExpectedAmount with negative amount balance - amountSubtract >= 2^255 (overflow) impossible", async function () {
	// 	newRequest = await requestCore.createRequest(creator, payee, payer, 0, 0, "", {from:fakeContract});
	// 	await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 2), new BigNumber(-2).pow(254), {from:fakeContract});
	// 	await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 2), new BigNumber(-2).pow(254), {from:fakeContract}));

	// 	var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 2), {from:fakeContract});
	// 	assert.equal(r[0],creator,"request wrong data : creator");
	// 	assert.equal(r[1],payee,"request wrong data : payee");
	// 	assert.equal(r[2],payer,"request wrong data : payer");
	// 	assert.equal(new BigNumber(0).minus(new BigNumber(2).pow(254)).comparedTo(r[3]),0,"request wrong data : expectedAmount");
	// 	assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
	// 	assert.equal(r[5],0,"new request wrong data : balance");
	// 	assert.equal(r[6],0,"new request wrong data : state");
	// });


	it("new updateExpectedAmount with negative amount expectedAmount - _amount - amountsubtract < 0 OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount60percent, {from:fakeContract});

		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), -arbitraryAmount60percent, {from:fakeContract});

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[0],creator,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount-arbitraryAmount60percent-arbitraryAmount60percent,"request wrong data : expectedAmount");
		assert.equal(r[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[6],0,"new request wrong data : state");
	});
	
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################
});


