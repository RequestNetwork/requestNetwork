var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");

contract('RequestEthereum PayBack',  function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var payeePayment = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];
	var payerPayment = accounts[7];
	var payee2Payment = accounts[8];
	var payee3Payment = accounts[9];

	var requestCore;
	var requestEthereum;
	var newRequest;

	var arbitraryAmount = 1000;
	var arbitraryAmount2 = 200;
	var arbitraryAmount3 = 300;
	var arbitraryAmount10percent = 100;
	var arbitraryAmount20percent = 200;
	var arbitraryAmount30percent = 300;

  beforeEach(async () => {
		requestCore = await RequestCore.new({from:admin});

		  	requestEthereum = await RequestEthereum.new(requestCore.address, 0, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var newRequest = await requestEthereum.createRequestAsPayee([payee,payee2,payee3], [payeePayment,payee2Payment,payee3Payment], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, 0, "", {from:payee});
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 1), {from:payer});
		await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 1), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer})
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
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});


	it("payback if Core Paused OK with refund address", async function () {
		var newRequest = await requestEthereum.createRequestAsPayee([payee,payee2,payee3], [], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, payerPayment, "", {from:payee});
		await requestEthereum.accept(utils.getRequestId(requestCore.address, 2), {from:payer});
		await requestEthereum.paymentAction(utils.getRequestId(requestCore.address, 2), [arbitraryAmount], [0], {value:arbitraryAmount, from:payer});

		var balancePayerBefore = await web3.eth.getBalance(payer);
		var balancePayerPaymentBefore = await web3.eth.getBalance(payerPayment);
		await requestCore.pause({from:admin});
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 2), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 2));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),0,"new request wrong data : amount to withdraw payer");
		assert.equal((await web3.eth.getBalance(payerPayment)).sub(balancePayerPaymentBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payerPayment");
	});
	
	it("payback request Ethereum pause impossible", async function () {
		await requestEthereum.pause({from:admin});
		await utils.expectThrow(requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee}));
	});
	
	it("payback request not exist impossible", async function () {
		await utils.expectThrow(requestEthereum.refundAction(666, {value:arbitraryAmount, from:payee}));
	});



	it("payback request just created ok", async function () {
		await requestEthereum.createRequestAsPayee([payee,payee2,payee3], [], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, 0, "", {from:payee});
		var r =await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 2), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 2),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 2));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],0,"new request wrong data : state");
	});

	it("payback request canceled impossible", async function () {
		await requestEthereum.createRequestAsPayee([payee,payee2,payee3], [], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], payer, 0, "", {from:payee});
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
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");

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
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount10percent,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");

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
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],0,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),0,"new request wrong data : amount to withdraw payer");
	});

	it("3 payback request", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount30percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount30percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount30percent,"new request wrong data : amount to withdraw payer");

		// second
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount20percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount20percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent-arbitraryAmount20percent,"new request wrong data : balance");		
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount20percent+arbitraryAmount30percent,"new request wrong data : amount to withdraw payer");

		// third
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount-arbitraryAmount30percent-arbitraryAmount20percent-arbitraryAmount10percent,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount30percent+arbitraryAmount20percent+arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});

	it("msg.value > amountAlreadyPaid OK", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);

	 	var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount+1, from:payee});

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],-1,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payer");
	});


	it("refund by subPayeeId OK", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);

		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee2});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount10percent,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});


	it("refund by subPayeePayment OK", async function () {
		var balancePayerBefore = await web3.eth.getBalance(payer);
		var r = await requestEthereum.refundAction(utils.getRequestId(requestCore.address, 1), {value:arbitraryAmount10percent, from:payee2Payment});

		assert.equal(r.receipt.logs.length,1,"Wrong number of events");
		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after refundAction()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],-arbitraryAmount10percent,"Event UpdateBalance wrong args amountRefunded");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : balance");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2,"new request wrong data : expectedAmount");
		assert.equal(r[2],-arbitraryAmount10percent,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3,"new request wrong data : expectedAmount");
		assert.equal(r[2],0,"new request wrong data : balance");

		assert.equal((await web3.eth.getBalance(payer)).sub(balancePayerBefore),arbitraryAmount10percent,"new request wrong data : amount to withdraw payer");
	});
});

