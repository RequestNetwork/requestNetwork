var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var ethUtil = require("ethereumjs-util");

// var ethABI = require("ethereumjs-abi");
// waiting for Solidity pack Array support (vrolland did a pull request)
var ethABI = require("../../../lib/ethereumjs-abi-perso.js"); 

const BN = require('bn.js')

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");

var BigNumber = require('bignumber.js');

contract('RequestEthereum createRequestAsPayer',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var requestCore;
	var requestEthereum;

	var arbitraryAmount = 1000;
	var arbitraryAmount10percent = 100;

    beforeEach(async () => {
		requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestBurnManagerSimple.setFeesPerTenThousand(100);// 1% collect
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
		requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    });

	it("new request more than expectedAmount (with tips that make the new requestment under expected) OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		var r = await requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent,"", 
													{from:payer, value:arbitraryAmount+arbitraryAmount/100+1});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
	});

	it("new request more than expectedAmount (with tips but still too much) Impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var r = await (requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													1,"", 
													{from:payer, value:arbitraryAmount+arbitraryAmount/100+2}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+1,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+2,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");
	});

	it("new request pay more than expectedAmount (without tips) Impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var r = await (requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													{from:payer, value:arbitraryAmount+arbitraryAmount/100+1}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");
	});

	it("new request with more tips than msg.value OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var r = await (requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent, "", 
													{from:payer, value:arbitraryAmount/100}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");
	});

	it("new request with tips OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		var r = await requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent,"", 
													{from:payer, value:arbitraryAmount+arbitraryAmount/100});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("new request payee==payer impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer(payer, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									{from:payer, value:arbitraryAmount+arbitraryAmount/100}));
	});

	it("new request payee==0 impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer(0, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									{from:payer, value:arbitraryAmount+arbitraryAmount/100}));
	});

	it("new request msg.sender==payee impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									{from:payee, value:arbitraryAmount+arbitraryAmount/100}));
	});

	it("impossible to createQuickquick request if Core Paused", async function () {
		await requestCore.pause({from:admin});

		var extension = 0;
		var listParamsExtensions = [];

		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									{from:payer, value:arbitraryAmount+arbitraryAmount/100}));
	});

	it("new request msg.value > 0 OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													{from:payer, value:arbitraryAmount+arbitraryAmount/100});

		assert.equal(r.receipt.logs.length,3,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("new request signed by payee", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													{from:payer, value:arbitraryAmount/100});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payer,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),0,"new request wrong data : amount to withdraw payee");
	});

	it("new request when currencyContract not trusted Impossible", async function () {
		var requestEthereum2 = await RequestEthereum.new(requestCore.address,{from:admin});
		await utils.expectThrow(requestEthereum2.createRequestAsPayer(payee, arbitraryAmount, 0, [], 0, "", {from:payer, value:arbitraryAmount+arbitraryAmount/100}));
	});

	it("new request with collect not payed or underpayed", async function () {
		await utils.expectThrow(requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 0, [], 0, "", {from:payer, value:1}));
		await utils.expectThrow(requestEthereum.createRequestAsPayer(payee, arbitraryAmount, 0, [], 0, "", {from:payer}));
	});
});

