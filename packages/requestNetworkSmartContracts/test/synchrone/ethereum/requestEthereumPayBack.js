var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");
var BigNumber = require('bignumber.js');



contract('RequestEthereum PayBack',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount10percent = 100;
	var arbitraryAmount20percent = 200;
	var arbitraryAmount30percent = 300;

    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
    	requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var newRequest = await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), 0, {value:arbitraryAmount, from:payer})
    });

	// ##################################################################################################
	// ### Accept test unit #############################################################################
	// ##################################################################################################
	it("payback if Core Paused OK", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		
		await requestCore.pause({from:admin});
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});

	it("payback request Ethereum pause impossible", async function () {
		await requestEthereum.pause({from:admin});
		await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee}));
	});
	
	it("payback request not exist impossible", async function () {
		await utils.expectThrow(requestEthereum.refundAction(666, {value:arbitraryAmount, from:payee}));
	});



	it("payback request just created Impossible", async function () {
		await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 2), {value:arbitraryAmount, from:payee}));
	});

	it("payback request canceled impossible", async function () {
		await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		await requestEthereum.cancel(utils.getRequestId(requestCore.address, 2), {from:payee});
		await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 2), {value:arbitraryAmount, from:payee}));
	});

	it("payback request from payer Impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount, from:payer}));
	});

	it("payback request from a random guy Impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount, from:otherguy}));
	});

	it("payback request accepted OK", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});

	it("payback request accepted OK - untrusted currencyContract", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		await requestCore.adminRemoveTrustedCurrencyContract(requestEthereum.address, {from:admin});
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################

	it("msg.value == 0 OK", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:0, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),0,"new request wrong data : amount to withdraw payer");
	});

	it("3 payback request", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount30percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount30percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount30percent,"new request wrong data : amount to withdraw payer");

		// second
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount20percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount20percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent-arbitraryAmount20percent,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount20percent+arbitraryAmount30percent,"new request wrong data : amount to withdraw payer");

		// third
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent-arbitraryAmount20percent-arbitraryAmount10percent,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount30percent+arbitraryAmount20percent+arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});

	// turn down the node
	// it("msg.value >= 2^256 Impossible", async function () {
	// 	var r = await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:new BigNumber(2).pow(256), from:payee}));
	// });

	it("msg.value > amountAlreadyPaid Impossible", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);

	 	var r = await (requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount+1, from:payee}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],-1,"new request wrong data : balance");
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payer");
	});

});

