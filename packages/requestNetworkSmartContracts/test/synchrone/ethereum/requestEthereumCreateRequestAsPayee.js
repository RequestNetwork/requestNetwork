var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");

var BigNumber = require('bignumber.js');


contract('RequestEthereum createRequestAsPayee',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var requestCore;
	var requestEthereum;

	var arbitraryAmount = 1000;

    beforeEach(async () => {
		requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestBurnManagerSimple.setFeesPerTenThousand(100);// 1% collect
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
    	requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    });


	it("basic check on payee payer creator", async function () {
		// new request payer==0 OK
		await utils.expectThrow(requestEthereum.createRequestAsPayee(0, arbitraryAmount, 0, [], "", {value:arbitraryAmount/100, from:payee}));
		// new request payee==payer impossible
		await utils.expectThrow(requestEthereum.createRequestAsPayee(payee, arbitraryAmount, 0, [], "", {value:arbitraryAmount/100,from:payee}));
	});

	it("basic check on expectedAmount", async function () {
		// new request _expectedAmount >= 2^256 impossible
		await utils.expectThrow(requestEthereum.createRequestAsPayee(payer, new BigNumber(2).pow(256), 0, [], "", {value:arbitraryAmount/100,from:payee}));
	});

	it("impossible to createRequest if Core Paused", async function () {
		await requestCore.pause({from:admin});
		await utils.expectThrow(requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {value:arbitraryAmount/100,from:payee}));
	});

	it("new request msg.sender==payee OK", async function () {
		var r = await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {value:arbitraryAmount/100,from:payee});

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var r = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(r[0],payee,"request wrong data : creator");
		assert.equal(r[1],payee,"request wrong data : payee");
		assert.equal(r[2],payer,"request wrong data : payer");
		assert.equal(r[3],arbitraryAmount,"request wrong data : expectedAmount");
		assert.equal(r[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(r[5],0,"new request wrong data : balance");
		
		
		assert.equal(r[6],0,"new request wrong data : state");

		var e = await requestCore.getExtension.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(e,0,"new request wrong data : extension1");
	});


	it("new request when currencyContract not trusted Impossible", async function () {
		var requestEthereum2 = await RequestEthereum.new(requestCore.address,{from:admin});
		await utils.expectThrow(requestEthereum2.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {value:arbitraryAmount/100,from:payee}));
	});


	it("new request with collect not payed or overpayed", async function () {
		await utils.expectThrow(requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {value:(arbitraryAmount/100)+1,from:payee}));
		await utils.expectThrow(requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee}));
		await utils.expectThrow(requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {value:1,from:payee}));
	});
});

