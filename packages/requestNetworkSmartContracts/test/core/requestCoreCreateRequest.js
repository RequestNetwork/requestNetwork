var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}
var RequestCore = artifacts.require("./core/RequestCore.sol");

var BigNumber = require('bignumber.js');


contract('RequestCore Create Request', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var creator = accounts[5];
	var payee2 = accounts[6];
	var payee3 = accounts[7];
	var contractForBurning = accounts[8];

	var arbitraryAmount = 100000000;
	var arbitraryAmount2 = 200000;
	var arbitraryAmount3 = 30000;

	// requestId start at 1 when Core is created
	it("Creation Core, requestId start at 0", async function () {
		var requestCore = await RequestCore.new();
		assert.equal(await requestCore.numRequests.call(),"0","RequestId start by 0");
	});

	// new request from non trustable sender (contract trusted) impossible
	it("request from non trustable sender (contract trusted) impossible", async function () {
		var requestCore = await RequestCore.new();

		await utils.expectThrow(requestCore.createRequest(creator, [payee], [arbitraryAmount], payer, "", {from:fakeContract}));
	});

	// impossible to createRequest if Core Paused
	it("impossible to createRequest if Core Paused", async function () {
		var requestCore = await RequestCore.new();
		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.pause({from:admin});

		await utils.expectThrow(requestCore.createRequest(creator, [payee], [arbitraryAmount], payer, "", {from:fakeContract}));
	});

	// new request _creator==0 impossible
	// new request payees==[] OK
	// new request payer==0 OK
	// new request payees[0]==payer OK
	it("Actors not null and payee!=payer", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		// new request _creator==0 impossible
		await utils.expectThrow(requestCore.createRequest(0, [payee], [arbitraryAmount], payer, "", {from:fakeContract}));

		// new request payees==0 OK
		var r = await requestCore.createRequest(creator, [], [], payer, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,0,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[3],0,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],0,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
		
		// new request payer==0 OK
		r = await requestCore.createRequest(creator, [payee], [arbitraryAmount], 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,2),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,0,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,2));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],0,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
		
		// new request payee==payer OK
		r = await requestCore.createRequest(creator, [payee], [arbitraryAmount], payee, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,3),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payee,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,3));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payee,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");	
	});


	// new request _expectedAmounts[0] == 0 OK
	// new request _expectedAmount[0] > 2^256 impossible
	it("expectedAmounts[0] == 0 and > 2^256", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, [payee], [0], payer, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],0,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
		
		var r = await requestCore.updateExpectedAmount(utils.getRequestId(requestCore.address,1), 0, arbitraryAmount, {from:fakeContract});
		assert.equal(r.logs[0].event,"UpdateExpectedAmount","Event is missing after setExpectedAmount()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.deltaAmount,arbitraryAmount,"wrong args arbitraryAmount");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		await utils.expectThrow(requestCore.createRequest(creator, [payee], [new BigNumber(2).pow(256)], payer, "", {from:fakeContract}));
	});


	// new request _expectedAmounts[1] == 0 OK
	// new request _expectedAmount[1] > 2^256 impossible
	it("expectedAmounts[1] == 0 and > 2^256", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, [payee, payee2], [arbitraryAmount, 0], payer, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
		
		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],0,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],0,"new subPayee wrong data : address");
		assert.equal(subPayee[1],0,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		await utils.expectThrow(requestCore.createRequest(creator, [payee, payee2], [arbitraryAmount, new BigNumber(2).pow(256)], payer, "", {from:fakeContract}));
	});



	// new request _expectedAmounts[0] < 0 OK
	// new request _expectedAmounts[0] > -2^256 impossible
	it("expectedAmounts[0] < 0 and > -2^255", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, [payee], [-arbitraryAmount], payer, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],-arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		await utils.expectThrow(requestCore.createRequest(creator, [payee], [new BigNumber(-2).pow(256)], payer, "", {from:fakeContract}));
	});


	// new request _expectedAmounts[1] < 0 OK
	// new request _expectedAmounts[1] > -2^256 impossible
	it("expectedAmounts[1] < 0 and > -2^255", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, [payee, payee2], [0, -arbitraryAmount], payer, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],0,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");


		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],-arbitraryAmount,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),1);
		assert.equal(subPayee[0],0,"new subPayee wrong data : address");
		assert.equal(subPayee[1],0,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

		await utils.expectThrow(requestCore.createRequest(creator, [payee], [new BigNumber(-2).pow(256)], payer, "", {from:fakeContract}));
	});

	it("new request with payees.length != expectedAmounts.length Impossible", async function () {
		var requestCore = await RequestCore.new();
		
		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		await utils.expectThrow(requestCore.createRequest(creator, [payee,payee2,payee3], [arbitraryAmount,arbitraryAmount2], payer, "", {from:fakeContract}));
	});

	it("new request", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		
		var r = await requestCore.createRequest(creator, [payee,payee2], [arbitraryAmount, arbitraryAmount2], payer, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"","Event Created wrong args payer");

		// var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));

		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
		
		var subPayee = await requestCore.subPayees.call(utils.getRequestId(requestCore.address,1),0);
		assert.equal(subPayee[0],payee2,"new subPayee wrong data : address");
		assert.equal(subPayee[1],arbitraryAmount2,"new subPayee wrong data : expectedAmount");
 		assert.equal(subPayee[2],0,"new subPayee wrong data : balance");

	});

	// new request with data
	it("new request with data", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, [payee], [arbitraryAmount], payer, "QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");
		assert.equal(r.logs[0].args.creator,creator,"Event Created wrong args creator");
		assert.equal(r.logs[0].args.data,"QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz","Event Created wrong args payer");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address,1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
	});

	it("impossible to createRequest if one of the subPayees is 0", async function () {
		var requestCore = await RequestCore.new();

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await utils.expectThrow(requestCore.createRequest(creator, [payee, 0], [arbitraryAmount, arbitraryAmount2], payer, "", {from:fakeContract}));
	});
});


