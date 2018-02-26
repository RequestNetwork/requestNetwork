var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");


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
	var payee2 = accounts[7];
	var payee3 = accounts[8];

	var arbitraryAmount = 100000000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount3 = 3000;
	var arbitraryAmount10percent = 10000000;
	var arbitraryAmount20percent = 20000000;
	var arbitraryAmount30percent = 30000000;
	var arbitraryAmount40percent = 40000000;

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
	// ### updateBalance with positive amount test unit #############################################################################
	// ##################################################################################################
	// updateBalance with positive amount request already accepted OK
	it("updateBalance first payee, with positive amount request accepted OK - check event log and request status", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");
		assert.equal(r.logs[0].args.payeeIndex,0,"Event UpdateBalance wrong args balance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(r[2],1,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	it("updateBalance second payee, with positive amount request accepted OK - check event log and request status", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 1,arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");
		assert.equal(r.logs[0].args.payeeIndex,1,"Event UpdateBalance wrong args balance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],1,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],arbitraryAmount10percent,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

	});

	// updateBalance with positive amount request already canceled OK
	it("updateBalance with positive amount request canceled OK - check event log and request status", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(r[2],2,"new request wrong data : state");
	});

	it("updateBalance with positive amount if Core Paused OK", async function () {
		await requestCore.pause({from:admin});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount10percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after updateBalance()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount10percent,"Event UpdateBalance wrong args balance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[2],0,"new request wrong data : state");
	});

	it("updateBalance with positive amount request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(2, 0, arbitraryAmount10percent, {from:fakeContract}));
	});

	it("updateBalance with positive amount request from a random guy impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:otherguy}));
	});

	it("updateBalance with positive amount request from other subcontract impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0, arbitraryAmount10percent, {from:fakeContract2}));
	});


	it("new updateBalance first payee with amount _amount==0 OK", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0, 0, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,0,"Event UpdateBalance wrong args balance");
		assert.equal(r.logs[0].args.payeeIndex,0,"Event UpdateBalance wrong args payeeIndex");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
	});


	it("new updateBalance second payee with amount _amount==0 OK", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 1, 0, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,0,"Event UpdateBalance wrong args balance");
		assert.equal(r.logs[0].args.payeeIndex,1,"Event UpdateBalance wrong args payeeIndex");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
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

	it("new updateBalance with positive amount _amount >= 2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,new BigNumber(2).pow(256), {from:fakeContract}));
	});

	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################


	// ##################################################################################################
	// ### updateBalance with negative amount test unit #############################################################################
	// ##################################################################################################
	it("updateBalance first payee with negative amount request created OK - check event log and request status", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],-arbitraryAmount20percent,"new request wrong data : balance");
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

	it("updateBalance second payee with negative amount request created OK - check event log and request status", async function () {
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 1,-arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],-arbitraryAmount20percent,"new subPayee wrong data : balance");

		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],payee3,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount3,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");
	});

	// updateBalance with negative amount request already accepted OK
	it("updateBalance with negative amount request accepted OK - check event log and request status", async function () {
		await requestCore.accept(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount30percent, {from:fakeContract});

		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[2],1,"new request wrong data : state");
	});

	// updateBalance with negative amount request already canceled OK
	it("updateBalance with negative amount request canceled OK - check event log and request status", async function () {
		await requestCore.cancel(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount30percent, {from:fakeContract});

		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[2],2,"new request wrong data : state");
	});

	it("updateBalance with negative amount if Core Paused OK", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount30percent, {from:fakeContract});
		await requestCore.pause({from:admin});

		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount20percent, {from:fakeContract});

		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(r[2],0,"new request wrong data : state");
	});

	it("updateBalance with negative amount request not exist impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 2), 0, -arbitraryAmount10percent, {from:fakeContract}));
	});

	it("updateBalance with negative amount request from a random guy impossible", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount30percent, {from:fakeContract});
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount10percent, {from:otherguy}));
	});

	it("updateBalance with negative amount request from other subcontract impossible", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount30percent, {from:fakeContract});
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount10percent, {from:fakeContract2}));
	});


	// new updateBalance with negative amount _amount <= -2^256 impossible
	it("new updateBalance with negative amount _amount <= -2^256 impossible", async function () {
		await utils.expectThrow(requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,new BigNumber(-2).pow(256), {from:fakeContract}));
	});

	it("new updateBalance with negative amount r.amounPaid - _amount == 0 OK", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount30percent, {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount30percent, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount30percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
	});

	it("new updateBalance with negative amount after a other updateBalance with negative amount", async function () {
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,arbitraryAmount40percent, {from:fakeContract});
		await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount10percent, {from:fakeContract});
		var r = await requestCore.updateBalance(utils.getRequestId(requestCore.address, 1), 0,-arbitraryAmount20percent, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateBalance","Event UpdateBalance is missing after accept()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,-arbitraryAmount20percent,"Event UpdateBalance wrong args amountUpdateBalance");

		var r = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1), {from:fakeContract});
		
		assert.equal(r[3],payee,"request wrong data : payee");
		assert.equal(r[0],payer,"request wrong data : payer");
		assert.equal(r[4],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(r[5],arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(r[2],0,"new request wrong data : state");
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################


});


