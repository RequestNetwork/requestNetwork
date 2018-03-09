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

contract('RequestEthereum createRequestAsPayer',  function(accounts) {
	var admin = accounts[0];
	var burnerContract = accounts[1];
	var fakeContract = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];
	var payeeAddressPayment = accounts[7];
	var payee2AddressPayment = accounts[8];
	var payee3AddressPayment = accounts[9];

	var requestCore;
	var requestEthereum;

	var arbitraryAmount = 100000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount3 = 30000;
	var arbitraryAmount10percent = 10000;

    beforeEach(async () => {
		requestCore = await RequestCore.new();
		
		requestEthereum = await RequestEthereum.new(requestCore.address, burnerContract, {from:admin});

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    });


	it("new request more than expectedAmount OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		var r = await requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount+1], [arbitraryAmount10percent],"", 
													{from:payer, value:arbitraryAmount+1});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payer,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
	});

	it("new request with more tips than msg.value OK", async function () {
		var r = await (requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [arbitraryAmount10percent], "", 
													{from:payer, value:arbitraryAmount}));

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");
	});

	it("new request with tips OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);

		var r = await requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [arbitraryAmount10percent], "", 
													{from:payer, value:arbitraryAmount});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payer,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("new request empty arrays impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer([], [], 0, [arbitraryAmount], [], "", 
									{from:payer, value:arbitraryAmount}));
	});

	it("new request payee==payer impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer([payer], [arbitraryAmount], 0, [arbitraryAmount], [], "", 
									{from:payer, value:arbitraryAmount}));
	});

	it("new request payee==0 impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer([0], [arbitraryAmount], 0, [arbitraryAmount], [], "", 
									{from:payer, value:arbitraryAmount}));
	});

	it("new request msg.sender==payee impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [], "", 
									{from:payee, value:arbitraryAmount}));
	});

	it("impossible to createQuickquick request if Core Paused", async function () {
		await requestCore.pause({from:admin});

		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [], "", 
									{from:payer, value:arbitraryAmount}));
	});

	it("new request msg.value > 0 OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var r = await requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [], '', 
													{from:payer, value:arbitraryAmount});

		assert.equal(r.receipt.logs.length,3,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payer,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount,"new request wrong data : amount to withdraw payee");
	});

	it("new request when currencyContract not trusted Impossible", async function () {
		var requestEthereum2 = await RequestEthereum.new(requestCore.address,{from:admin});
		await utils.expectThrow(requestEthereum2.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [], "", {from:payer, value:arbitraryAmount}));
	});

	it("new request from payer with 3 payees all paid OK with tips no payment address", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var balancePayee2Before = await web3.eth.getBalance(payee2);
		var balancePayee3Before = await web3.eth.getBalance(payee3);

		var r = await requestEthereum.createRequestAsPayer([payee, payee2, payee3], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 0, [arbitraryAmount+1,arbitraryAmount2+2,arbitraryAmount3+3], [1,2,3], "", 
													{from:payer, value:arbitraryAmount+arbitraryAmount2+arbitraryAmount3+6});

		assert.equal(r.receipt.logs.length,10,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payer,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[1].topics[2]).toLowerCase(),payee2,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"NewSubPayee","Event NewSubPayee is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event NewSubPayee wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[2].topics[2]).toLowerCase(),payee3,"Event NewSubPayee wrong args payee");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[4], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[4].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],1,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[5], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[5].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],2,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[6], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[6].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],2,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],3,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[7], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[7].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[8], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[8].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],1,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount2+2,"Event UpdateBalance wrong args amountPaid");

		var l = utils.getEventFromReceipt(r.receipt.logs[9], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[9].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],2,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount3+3,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+1,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");

		var count = await requestCore.getSubPayeesCount.call(utils.getRequestId(requestCore.address,1));
		assert.equal(count,2,"number of subPayee wrong");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),0);	
		assert.equal(r[0],payee2,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount2+2,"new request wrong data : expectedAmount");
		assert.equal(r[2],arbitraryAmount2+2,"new request wrong data : balance");

		var r = await requestCore.subPayees.call(utils.getRequestId(requestCore.address, 1),1);	
		assert.equal(r[0],payee3,"request wrong data : payer");
		assert.equal(r[1],arbitraryAmount3+3,"new request wrong data : expectedAmount");
		assert.equal(r[2],arbitraryAmount3+3,"new request wrong data : balance");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
		assert.equal((await web3.eth.getBalance(payee2)).sub(balancePayee2Before),arbitraryAmount2+2,"new request wrong data : amount to withdraw payee");
		assert.equal((await web3.eth.getBalance(payee3)).sub(balancePayee3Before),arbitraryAmount3+3,"new request wrong data : amount to withdraw payee");
	});

	it("new request msg.value don't match payments array impossible", async function () {
		var r = await utils.expectThrow(requestEthereum.createRequestAsPayer([payee,payee2,payee3], [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], 0, [arbitraryAmount,arbitraryAmount2,arbitraryAmount3], [], "", 
									{from:payer, value:arbitraryAmount+arbitraryAmount2+arbitraryAmount3-1}));
	});




	it("new request more than expectedAmount OK", async function () {
		var balancePayeeBefore = await web3.eth.getBalance(payee);
		var balanceBurnerContractBefore = await web3.eth.getBalance(burnerContract);
		await requestEthereum.setFeesPerTenThousand(10, {from:admin}); // 0.01% fees
		var fees = await requestEthereum.collectEstimation(arbitraryAmount);

		var r = await requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount+1], [arbitraryAmount10percent],"", 
													{from:payer, value:fees.add(arbitraryAmount).add(1)});

		assert.equal(r.receipt.logs.length,4,"Wrong number of events");

		var l = utils.getEventFromReceipt(r.receipt.logs[0], requestCore.abi);
		assert.equal(l.name,"Created","Event Created is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[0].topics[1],utils.getRequestId(requestCore.address, 1),"Event Created wrong args requestId");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[2]).toLowerCase(),payee,"Event Created wrong args payee");
		assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[0].topics[3]).toLowerCase(),payer,"Event Created wrong args payer");
		assert.equal(l.data[0].toLowerCase(),payer,"Event Created wrong args creator");
		assert.equal(l.data[1],'',"Event Created wrong args data");

		var l = utils.getEventFromReceipt(r.receipt.logs[1], requestCore.abi);
		assert.equal(l.name,"Accepted","Event Accepted is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[1].topics[1],utils.getRequestId(requestCore.address, 1),"Event Accepted wrong args requestId");

		var l = utils.getEventFromReceipt(r.receipt.logs[2], requestCore.abi);
		assert.equal(l.name,"UpdateExpectedAmount","Event UpdateExpectedAmount is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[2].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateExpectedAmount wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateExpectedAmount wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount10percent,"Event UpdateExpectedAmount wrong args amount");

		var l = utils.getEventFromReceipt(r.receipt.logs[3], requestCore.abi);
		assert.equal(l.name,"UpdateBalance","Event UpdateBalance is missing after createRequestAsPayer()");
		assert.equal(r.receipt.logs[3].topics[1],utils.getRequestId(requestCore.address, 1),"Event UpdateBalance wrong args requestId");
		assert.equal(l.data[0],0,"Event UpdateBalance wrong args payeeIndex");
		assert.equal(l.data[1],arbitraryAmount+1,"Event UpdateBalance wrong args amountPaid");

		var newReq = await requestCore.getRequest.call(utils.getRequestId(requestCore.address, 1));
		
		assert.equal(newReq[3],payee,"new request wrong data : payee");
		assert.equal(newReq[0],payer,"new request wrong data : payer");
		assert.equal(newReq[4],arbitraryAmount+arbitraryAmount10percent,"new request wrong data : expectedAmount");
		assert.equal(newReq[1],requestEthereum.address,"new request wrong data : currencyContract");
		assert.equal(newReq[5],arbitraryAmount+1,"new request wrong data : amountPaid");
		assert.equal(newReq[2],1,"new request wrong data : state");

		assert.equal((await web3.eth.getBalance(payee)).sub(balancePayeeBefore),arbitraryAmount+1,"new request wrong data : amount to withdraw payee");
		assert((await web3.eth.getBalance(burnerContract)).sub(balanceBurnerContractBefore).equals(fees),"new request wrong data : amount to burnerContract");
	});

	it("impossible to createRequest if msg.value < fees", async function () {
		await requestEthereum.setFeesPerTenThousand(10, {from:admin}); // 0.01% fees
		var fees = await requestEthereum.collectEstimation(arbitraryAmount);
		await utils.expectThrow(requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [arbitraryAmount10percent],"", {from:payer, value:fees.add(arbitraryAmount).minus(1)}));
	});
	it("impossible to createRequest if msg.value > fees", async function () {
		await requestEthereum.setFeesPerTenThousand(10, {from:admin}); // 0.01% fees
		var fees = await requestEthereum.collectEstimation(arbitraryAmount);
		await utils.expectThrow(requestEthereum.createRequestAsPayer([payee], [arbitraryAmount], 0, [arbitraryAmount], [arbitraryAmount10percent],"", {from:payer, value:fees.add(arbitraryAmount).add(1)}));
	});

});

