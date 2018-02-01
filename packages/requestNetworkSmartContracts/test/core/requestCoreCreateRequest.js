var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}
var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");
var BigNumber = require('bignumber.js');


contract('RequestCore Create Request', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var creator = accounts[5];
	var fakeExtention1 = accounts[6];
	var fakeExtention2 = accounts[7];
	var contractForBurning = accounts[8];

	var arbitraryAmount = 100000000;

	// requestId start at 1 when Core is created
	it("Creation Core, requestId start at 0", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		assert.equal(await requestCore.numRequests.call(),"0","RequestId start by 0");
	});

	// new request from non trustable sender (contract trusted) impossible
	it("request from non trustable sender (contract trusted) impossible", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {from:fakeContract}));
	});

	// impossible to createRequest if Core Paused
	it("impossible to createRequest if Core Paused", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.pause({from:admin});

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {from:fakeContract}));
	});

	// new request _creator==0 impossible
	// new request payee==0 OK
	// new request payer==0 OK
	// new request payee==payer OK
	it("Actors not null and payee!=payer", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});


		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		// new request _creator==0 impossible
		await utils.expectThrow(requestCore.createRequest(0, payee, payer, arbitraryAmount, 0, "", {from:fakeContract}));

		// new request payee==0 OK
		var r = await requestCore.createRequest(creator, 0, payer, arbitraryAmount, 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,0,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],0,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		var r = await requestCore.setPayee(utils.getRequestId(requestCore.address,1), payee, {from:fakeContract});
		assert.equal(r.logs[0].event,"NewPayee","Event is missing after setPayee()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"wrong args payee");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		// new request payer==0 OK
		r = await requestCore.createRequest(creator, payee, 0, arbitraryAmount, 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,2),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,0,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,2));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],0,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");


		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		var r = await requestCore.setPayer(utils.getRequestId(requestCore.address,2), payer, {from:fakeContract});
		assert.equal(r.logs[0].event,"NewPayer","Event is missing after setPayer()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,2),"wrong args requestId");
		assert.equal(r.logs[0].args.payer,payer,"wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,2));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		// new request payee==payer OK
		r = await requestCore.createRequest(creator, payee, payee, arbitraryAmount, 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,3),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payee,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,3));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payee,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");
	});


	// new request _expectedAmount == 0 OK
	// new request _expectedAmount > 2^256 impossible
	it("expectedAmount == 0 and > 2^255", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});


		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, payee, payer, 0, 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],0,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		var r = await requestCore.setExpectedAmount(utils.getRequestId(requestCore.address,1), arbitraryAmount, {from:fakeContract});
		assert.equal(r.logs[0].event,"NewExpectedAmount","Event is missing after setExpectedAmount()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.expectedAmount,arbitraryAmount,"wrong args arbitraryAmount");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, new BigNumber(2).pow(256), 0, "", {from:fakeContract}));
	});
	// new request _expectedAmount < 0 OK
	// new request _expectedAmount > -2^256 impossible
	it("expectedAmount < 0 and > -2^255", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});


		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, payee, payer, -arbitraryAmount, 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],-arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, new BigNumber(-2).pow(256), 0, "", {from:fakeContract}));
	});


	// new request without extensions
	it("new request without extensions", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedExtension(fakeExtention1, {from:admin});

		var r = await requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");


		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		var newReqExtension = await requestCore.getExtension.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReqExtension,0,"new request wrong data : Extension[0]");


		var r = await requestCore.setExtension(utils.getRequestId(requestCore.address,1), fakeExtention1, {from:fakeContract});
		assert.equal(r.logs[0].event,"NewExtension","Event is missing after setExtension()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.extension,fakeExtention1,"wrong args extension");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],fakeExtention1,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");


		var r = await requestCore.setData(utils.getRequestId(requestCore.address,1), "hello world!", {from:fakeContract});
		assert.equal(r.logs[0].event,"NewData","Event is missing after setData()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.data,"hello world!","wrong args data");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],fakeExtention1,"new request wrong data : extension");
		assert.equal(newReq[8],"hello world!","new request wrong data : data");
	});

	// new request with data
	it("new request without extensions", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz", {from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],"QmSbfaY3FRQQNaFx8Uxm6rRKnqwu8s9oWGpRmqgfTEgxWz","new request wrong data : data");

		var newReqExtension = await requestCore.getExtension.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReqExtension,0,"new request wrong data : Extension[0]");
	});
	// new request with 1 extension trusted
	it("new request with 1 extension valid", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedExtension(fakeExtention1, {from:admin});

		var r = await requestCore.createRequest(creator, payee, payer, arbitraryAmount, fakeExtention1, "", {from:fakeContract});

		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId,utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],fakeExtention1,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");


		var newReqExtension = await requestCore.getExtension.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReqExtension,fakeExtention1,"new request wrong data : Extension");
	});


	// new request with 1 extension not trusted
	it("new request with 1 extension not trusted", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});


		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, arbitraryAmount, fakeExtention1, "", {from:fakeContract}));
	});

	it("new request with collect 1%", async function () {
		var balanceContractForBurning = await web3.eth.getBalance(otherguy);

		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(otherguy); 
		await requestBurnManagerSimple.setFeesPerTenThousand(100);// 1% collect
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedExtension(fakeExtention1, {from:admin});

		var r = await requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {value:arbitraryAmount/100,from:fakeContract});
		assert.equal(r.logs[0].event,"Created","Event Created is missing after createRequest()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"Event Created wrong args requestId");
		assert.equal(r.logs[0].args.payee,payee,"Event Created wrong args payee");
		assert.equal(r.logs[0].args.payer,payer,"Event Created wrong args payer");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");


		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],0,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");

		var newReqExtension = await requestCore.getExtension.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReqExtension,0,"new request wrong data : Extension[0]");


		var r = await requestCore.setExtension(utils.getRequestId(requestCore.address,1), fakeExtention1, {from:fakeContract});
		assert.equal(r.logs[0].event,"NewExtension","Event is missing after setExtension()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.extension,fakeExtention1,"wrong args extension");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],fakeExtention1,"new request wrong data : extension");
		assert.equal(newReq[8],0,"new request wrong data : data");


		var r = await requestCore.setData(utils.getRequestId(requestCore.address,1), "hello world!", {from:fakeContract});
		assert.equal(r.logs[0].event,"NewData","Event is missing after setData()");
		assert.equal(r.logs[0].args.requestId, utils.getRequestId(requestCore.address,1),"wrong args requestId");
		assert.equal(r.logs[0].args.data,"hello world!","wrong args data");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		assert.equal(newReq[6],0,"new request wrong data : state");
		assert.equal(newReq[7],fakeExtention1,"new request wrong data : extension");
		assert.equal(newReq[8],"hello world!","new request wrong data : data");

		// assert.equal((await web3.eth.getBalance(contractForBurning)).sub(balanceContractForBurning),arbitraryAmount/100,"amount collected wrong");

	});

	it("new request with collect 1% not payed or overpayed", async function () {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestBurnManagerSimple.setFeesPerTenThousand(100);// 1% collect
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedExtension(fakeExtention1, {from:admin});

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {from:fakeContract}));

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {value:1,from:fakeContract}));

		await utils.expectThrow(requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {value:(arbitraryAmount/100)+1,from:fakeContract}));
	});

	it("new request with collect over max", async function () {
		var balanceContractForBurning = await web3.eth.getBalance(contractForBurning);

		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(contractForBurning); 
		await requestBurnManagerSimple.setFeesPerTenThousand(20000);// 200% collect
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await requestCore.adminAddTrustedExtension(fakeExtention1, {from:admin});

		var arbitraryAmount = web3.toWei(1,"ether");
		var max = web3.toWei(0.002,"ether");
		await requestCore.createRequest(creator, payee, payer, arbitraryAmount, 0, "", {value:max,from:fakeContract});

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address,1));
		assert.equal(newReq[0],creator,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],fakeContract,"new request wrong data : currencyContract");

		assert.equal((await web3.eth.getBalance(contractForBurning)).sub(balanceContractForBurning),max,"amount collected wrong");
	});
	
});


