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


var hashRequest = function(contract, payees, expectedAmounts, payer, data, expirationDate) {
	const requestParts = [
        {value: contract, type: "address"},
        {value: payees, type: "address[]"},
        {value: expectedAmounts, type: "int256[]"},
        {value: payer, type: "address"},
        {value: data, type: "string"},
        {value: expirationDate, type: "uint256"}
    ];
    var types = [];
    var values = [];
    requestParts.forEach(function(o,i) {
    	types.push(o.type);
    	values.push(o.value);
    });

    return ethABI.soliditySHA3(types, values);
}

var signHashRequest = function (hash, address) {
	return web3.eth.sign(address, ethUtil.bufferToHex(hash));
}

contract('RequestEthereum broadcastSignedRequestAsPayer',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];

	var privateKeyOtherGuy = "1ba414a85acdd19339dacd7febb40893458433bee01201b7ae8ca3d6f4e90994";
	var privateKeyPayer = "b383a09e0c750bcbfe094b9e17ee31c6a9bb4f2fcdc821d97a34cf3e5b7f5429";
	var privateKeyPayee = "5f1859eee362d44b90d4f3cdd14a8775f682e08d34ff7cdca7e903d7ee956b6a";

	// var creator = accounts[5];
	var fakeExtention1;
	var fakeExtention2;
	var fakeExtention3;
	var fakeExtention4Untrusted = accounts[9];

	var requestCore;
	var requestEthereum;

	var arbitraryAmount = 1000;
	var arbitraryAmount2 = 200;
	var arbitraryAmount3 = 300;
	var arbitraryAmount10percent = 100;

	var timeExpiration;

  beforeEach(async () => {
  	requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		timeExpiration = (new Date("01/01/2222").getTime() / 1000);

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    });

	it("new quick request more than expectedAmount (with tips that make the new quick requestment under expected) OK", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount});

		assert.equal(r.receipt.logs.length,5,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payee,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args position");
		assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[4], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[4].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args position");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new quick request wrong data : payee");
		assert.equal(newReq[0],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new quick request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new quick request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	
	});


	it("new quick request pay more than expectedAmount (without tips) OK", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount});


		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new quick request wrong data : payee");
		assert.equal(newReq[0],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[4],arbitraryAmount,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new quick request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new quick request wrong data : state");
	});

	it("new quick request more than expectedAmount (with tips but still too much)", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount+2];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount+2});

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		// assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[3],payee,"new quick request wrong data : payee");
		assert.equal(newReq[0],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[4],arbitraryAmount,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+2,"new quick request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new quick request wrong data : state");
	});


	it("new quick request with more tips than msg.value", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount});


		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[3],payee,"new quick request wrong data : payee");
		assert.equal(newReq[0],payer,"new quick request wrong data : payer");	
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new quick request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new quick request wrong data : state");
	});

	it("new quick request payee==payer impossible", async function () {
		var payees = [payer, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});

	it("new quick request payee==0 impossible", async function () {
		var payees = [0, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});

	it("new quick request msg.sender==payee impossible", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payee, value:arbitraryAmount}));
	});


	it("impossible to broadcastSignedRequestAsPayer if Core Paused", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [arbitraryAmount+arbitraryAmount10percent];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);
		
		await requestCore.pause({from:admin});
		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});


	it("new quick request signed by payer Impossible", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payer);
		
		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});

	it("new quick request signed by otherguy Impossible", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,otherguy);
		
		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});

	it("new quick request signature doest match data impossible", async function () {
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);
		
		expectedAmounts[0] = 1;
		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});

	it("new request when currencyContract not trusted Impossible", async function () {
		var requestEthereum2 = await RequestEthereum.new(requestCore.address,{from:admin});
		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);
		
		var r = await utils.expectThrow(requestEthereum2.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});


	it("new quick request expired", async function () {
		timeExpiration = (new Date().getTime() / 1000) - 60;

		var payees = [payee, payee2];
		var expectedAmounts = [arbitraryAmount,arbitraryAmount2];
		var payeeAmounts = [arbitraryAmount];
		var additionals = [];
		var data = "";

		var hash = hashRequest(requestEthereum.address, payees, expectedAmounts, 0, data, timeExpiration);
		var signature = await signHashRequest(hash,payee);
		
		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(
						payees, 
						expectedAmounts,
						payeeAmounts,
						additionals, 
						data, 
						timeExpiration,
						signature,
						{from:payer, value:arbitraryAmount}));
	});
});
