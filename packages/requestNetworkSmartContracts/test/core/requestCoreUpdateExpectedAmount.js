var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");


var BigNumber = require('bignumber.js');

contract('RequestCore updateExpectedAmount', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var creator = accounts[5];
	var fakeContract2 = accounts[6];
	var payee2 = accounts[7];
	var payee3 = accounts[8];

	var arbitraryAmount = 100000000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount3 = 3000;
	var arbitraryAmount10percent = 10000000;
	var arbitraryAmount20percent = 20000000;
	var arbitraryAmount30percent = 30000000;
	var arbitraryAmount40percent = 40000000;
	var arbitraryAmount60percent = 60000000;

	var requestCore;
	var newRequest;

    beforeEach(async () => {
		requestCore = await RequestCore.new();
		; 
		

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(fakeContract2, {from:admin});

		var r = await requestCore.createRequest(creator, [payee, payee2, payee3], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, "", {from:fakeContract});
    })

	// ##################################################################################################
	// ### updateExpectedAmount with positive delta test unit #############################################################################
	// ##################################################################################################
	it("updateExpectedAmount first payee with positive delta on request created OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	it("updateExpectedAmount second payee with positive delta on request created OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 1, arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
		
		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2+arbitraryAmount10percent,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	// updateExpectedAmount with positive delta on request already accepted OK
	it("updateExpectedAmount with positive delta on request accepted OK", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],1,"new request wrong data : state");
	});

	// updateExpectedAmount request already canceled OK
	it("updateExpectedAmount request canceled OK", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],2,"new request wrong data : state");
	});

	it("updateExpectedAmount if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount+arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
	});

	it("updateExpectedAmount request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 2), 0, arbitraryAmount10percent, {from:fakeContract}));
	});

	it("updateExpectedAmount request from a random guy impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:otherguy}));
	});

	it("updateExpectedAmount request from other subcontract impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract2}));
	});

	it("new updateExpectedAmount first payee with positive amount after a other updateExpectedAmount with positive delta", async function () {
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract});
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract});

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount+arbitraryAmount20percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});


	it("new updateExpectedAmount second payee with positive amount after a other updateExpectedAmount with positive delta", async function () {
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 1, arbitraryAmount10percent, {from:fakeContract});
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 1, arbitraryAmount10percent, {from:fakeContract});

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2+arbitraryAmount20percent,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	it("new updateExpectedAmount _amount==0 OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, 0, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,0,"Event UpdateExpectedAmount wrong args amountAdded");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
	});

	it("new updateExpectedAmount _amount >= 2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, new BigNumber(2).pow(256), {from:fakeContract}));
	});



	it("new updateExpectedAmount with positive delta balance + amountAdditional >= 2^256 (overflow) impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, new BigNumber(2).pow(256), {from:fakeContract}));
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################




	// ##################################################################################################
	// ### updateExpectedAmount with negative amount test unit #############################################################################
	// ##################################################################################################
	it("updateExpectedAmount first payee with negative amount on request created OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	it("updateExpectedAmount second payee with negative amount on request created OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 1, -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2-arbitraryAmount10percent,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	// updateExpectedAmount with negative amount on request already accepted OK
	it("updateExpectedAmount with negative amount on request accepted OK", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],1,"new request wrong data : state");
	});

	// updateExpectedAmount request already canceled OK
	it("updateExpectedAmount request canceled OK", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],2,"new request wrong data : state");
	});

	it("addSubtract if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after updateExpectedAmount()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amountSubtracted");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount-arbitraryAmount10percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
	});

	it("addSubtract request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 2), 0, -arbitraryAmount10percent, {from:fakeContract}));
	});

	it("addSubtract request from a random guy impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:otherguy}));
	});

	it("addSubtract request from other subcontract impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract2}));
	});


	it("new addSubtract _amount >= 2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, new BigNumber(-2).pow(256), {from:fakeContract}));
	});

	it("new updateExpectedAmount with negative amount after a other updateExpectedAmount with negative amount", async function () {
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract});
		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount10percent, {from:fakeContract});

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount-arbitraryAmount20percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
	});

	it("new updateExpectedAmount first payee with negative amount expectedAmount - _amount - amountsubtract < 0 OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount60percent, {from:fakeContract});

		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 0, -arbitraryAmount60percent, {from:fakeContract});

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount-arbitraryAmount60percent-arbitraryAmount60percent,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});
	
	it("new updateExpectedAmount second payee with negative amount expectedAmount - _amount - amountsubtract < 0 OK", async function () {
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 1, -arbitraryAmount60percent, {from:fakeContract});

		await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address, 1), 1, -arbitraryAmount60percent, {from:fakeContract});

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2-arbitraryAmount60percent-arbitraryAmount60percent,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################
});


