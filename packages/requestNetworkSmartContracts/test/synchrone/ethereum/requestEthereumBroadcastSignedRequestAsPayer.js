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


var hashRequest = function(contract, payee, payer, arbitraryAmount, extension, extParams, data, expirationDate) {
	const requestParts = [
        {value: contract, type: "address"},
        {value: payee, type: "address"},
        {value: payer, type: "address"},
        {value: arbitraryAmount, type: "int256"},
        {value: extension, type: "address"},
        {value: extParams, type: "bytes32[9]"},
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

var signHashRequest = function(hash,privateKey) {
	return ethUtil.ecsign(ethUtil.hashPersonalMessage(hash), privateKey);
}



contract('RequestEthereum broadcastSignedRequestAsPayer',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
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
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount+1});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount10percent,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
	});


	it("new quick request pay more than expectedAmount (without tips) OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount+2});

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[3],arbitraryAmount,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+2,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");

	});

	it("new quick request more than expectedAmount (with tips but still too much) Impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													1, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount+2});

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[3],arbitraryAmount+1,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+2,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");
	});


	it("new quick request with more tips than msg.value Impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:0});

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");		
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount10percent,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");
	});

	it("new quick request with tips OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount10percent,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("new quick request payee==payer impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(payer, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payer, value:arbitraryAmount}));
	});

	it("new quick request payee==0 impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, 0, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);;
		
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(0, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payer, value:arbitraryAmount}));
	});


	it("new quick request msg.sender==payee impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payee, value:arbitraryAmount}));
	});

	it("new quick request msg.sender==otherguy OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:otherguy, value:arbitraryAmount});
		
		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],otherguy,"new quick request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");
	});

	it("impossible to createQuickquick request if Core Paused", async function () {
		await requestCore.pause({from:admin});

		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payer, value:arbitraryAmount}));
	});

	it("new quick request msg.value > 0 OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount});

		assert.equal(r.receipt.logs.length,3,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("new quick request signed by payee and data match signature OK", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:0});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after broadcastSignedRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new quick request wrong data : creator");
		assert.equal(newReq[1],payee,"new quick request wrong data : payee");
		assert.equal(newReq[2],payer,"new quick request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new quick request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new quick request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new quick request wrong data : amountPaid");
		assert.equal(newReq[6],1,"new quick request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),0,"new request wrong data : amount to withdraw payee");
	});

	it("new quick request signed by payer Impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyPayer, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payer, value:arbitraryAmount}));
	});

	it("new quick request signed by otherguy Impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyOtherGuy, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payer, value:arbitraryAmount}));
	});

	it("new quick request signature doest match data impossible", async function () {
		var extension = 0;
		var listParamsExtensions = [];
		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		var r = await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(otherguy, arbitraryAmount, 
									extension,
									listParamsExtensions, 
									0, "", 
									timeExpiration, 
									sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
									{from:payer, value:arbitraryAmount}));
	});

	it("new request when currencyContract not trusted Impossible", async function () {
		var requestEthereum2 = await RequestEthereum.new(requestCore.address,{from:admin});

		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum2.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		await utils.expectThrow(requestEthereum2.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													arbitraryAmount10percent, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount+1}));
	});


	it("new quick request expired", async function () {
		var extension = 0;
		var listParamsExtensions = [];

		var hash = hashRequest(requestEthereum.address, payee, 0, arbitraryAmount, extension, listParamsExtensions, "", timeExpiration);
		var ecprivkey = Buffer.from(privateKeyPayee, 'hex');
		var sig = signHashRequest(hash,ecprivkey);

		timeExpiration = (new Date().getTime() / 1000) - 60;

		await utils.expectThrow(requestEthereum.broadcastSignedRequestAsPayer(payee, arbitraryAmount, 
													extension,
													listParamsExtensions, 
													0, "", 
													timeExpiration, 
													sig.v, ethUtil.bufferToHex(sig.r), ethUtil.bufferToHex(sig.s),
													{from:payer, value:arbitraryAmount}));

	});

});
