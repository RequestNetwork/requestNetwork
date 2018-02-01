var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");
var BigNumber = require('bignumber.js');



contract('RequestEthereum Pay', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount2 = 300;
	var arbitraryAmount3 = 100;
	var arbitraryTips = 100;

	var defaultGasPrice = new BigNumber(10000000000);
 
    beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0); 
		await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		
    	requestEthereum = await RequestEthereum.new(requestCore.address,{from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var newRequest = await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
    });

	// ##################################################################################################
	// ### Pay test unit #############################################################################
	// ##################################################################################################
	it("pay if Core Paused OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		await requestCore.pause({from:admin});
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("pay request Ethereum pause impossible", async function () {
		await requestEthereum.pause({from:admin});
		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payer}));
	});

	// it("impossible to pay if Core Deprecated", async function () {
	// 	await requestCore.adminDeprecate({from:admin});
	// 	await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payer}));
	// });

	it("pay request not exist impossible", async function () {
		await utils.expectThrow(requestEthereum.paymentAction(666,0, {value:arbitraryAmount, from:payer}));
	});

	it("pay request by payer just created => accept auto", async function () {
		await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});

		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 2),0, {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,2,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 2));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[6],1,"new request wrong data : state");
	});
	it("pay request by otherguy just created => impossible", async function () {
		await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});

		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 2),0, {value:arbitraryAmount, from:otherguy}));
	});


	it("pay request canceled impossible", async function () {
		await requestEthereum.createRequestAsPayee(payer, arbitraryAmount, 0, [], "", {from:payee});
		await requestEthereum.cancel(utils.getRequestId(requestCore.address, 2), {from:payee});
		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 2),0, {value:arbitraryAmount, from:payer}));
	});

	it("pay request from payee OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");
	});

		
	it("pay request from payee OK - untrusted currencyContract", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		await requestCore.adminRemoveTrustedCurrencyContract(requestEthereum.address, {from:admin});
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");
	});

	it("pay request from a random guy OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:otherguy});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");;
	});

	it("pay request created OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");;
	});
	// ##################################################################################################
	// ##################################################################################################
	// ##################################################################################################

	it("msg.value == 0 OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:0, from:payer});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],0,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),0,"new request wrong data : amount to withdraw payee");
	});

	it("3 pay request ", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount3, from:payer});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount3,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount3,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount3,"new request wrong data : amount to withdraw payee");

		// second
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount2, from:payer});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount2,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount3+arbitraryAmount2,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount3+arbitraryAmount2,"new request wrong data : amount to withdraw payee");

		// third
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount, from:payer});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayee()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount3+arbitraryAmount2+arbitraryAmount,"new request wrong data : balance");
		
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount3+arbitraryAmount2+arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("pay by otherguy with tips Impossible", async function () {
		await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),arbitraryTips, {value:arbitraryAmount, from:otherguy}));
	});

	it("pay by payer with tips OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),arbitraryTips, {value:arbitraryAmount, from:payer});
		assert.equal(r.receipt.logs.length,2,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],arbitraryTips,"Event UpdateExpectedAmount wrong args amountAdditional");

		l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryTips,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("pay with more tips than msg.value Impossible", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await (requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),arbitraryAmount, {value:arbitraryTips, from:payer}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryTips,"new request wrong data : balance");		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryTips,"new request wrong data : amount to withdraw payee");
	});

	it("pay more than expectedAmount (without tips) Impossible", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await (requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:arbitraryAmount+1, from:payer}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : balance");		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
	});

	it("pay more than expectedAmount (without tips but still to much) Impossible", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		var r = await (requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),1, {value:arbitraryAmount+2, from:payer}));

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+1,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+2,"new request wrong data : balance");		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+2,"new request wrong data : amount to withdraw payee");

	});

	it("pay more than expectedAmount (with tips that make the payment under expected) OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),arbitraryTips, {value:arbitraryAmount+1, from:payer});
		assert.equal(r.receipt.logs.length,2,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],arbitraryTips,"Event UpdateExpectedAmount wrong args amountAdditional");

		l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after paymentAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.requests.call(utils.getRequestId(requestCore.address, 1));
		assert.equal(newReq[0],payee,"new request wrong data : creator");
		assert.equal(newReq[1],payee,"new request wrong data : payee");
		assert.equal(newReq[2],payer,"new request wrong data : payer");
		assert.equal(newReq[3],arbitraryAmount+arbitraryTips,"new request wrong data : expectedAmount");
		assert.equal(newReq[4],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : balance");
		
		assert.equal(newReq[6],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
	});

	// turn down the node
	// it("msg.value >= 2^256 Impossible", async function () {
	// 	var r = await utils.expectThrow(requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1),0, {value:new BigNumber(2).pow(256), from:payee}));
	// });


	var areAlmostEquals = function(a,b,precision) {
		if(a.lt(b)) {
			var temp = a;
			a = b;
			b = temp;
		}
		precision = precision ? precision : 0.000001;
		return a.sub(b).lte(a.mul(precision)) || a.equals(b);
	}
});

