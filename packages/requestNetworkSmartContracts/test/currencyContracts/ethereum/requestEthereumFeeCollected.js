var config = require("../../config.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");


contract('RequestEthereum Fee collected', function(accounts) {
  var admin = accounts[0];
	var burnerContract = accounts[1];

	var payerRefund = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var payeePayment = accounts[5];

	var requestCore;
	var requestEthereum;
	var testToken;

  var minterAmount = '1000000000000000000';
	var arbitraryAmount = 1000000000000000;  // 0.001 ether


  beforeEach(async () => {
		requestCore = await RequestCore.new();
		requestEthereum = await RequestEthereum.new(requestCore.address, burnerContract, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
    await requestEthereum.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestEthereum.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether
	});

  it("fee collected", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestEthereum.collectEstimation(arbitraryAmount);
    var r = await requestEthereum.createRequestAsPayeeAction(
										[payee],
										[payeePayment],
										[arbitraryAmount],
										payer,
										payerRefund,
										"",
										{from:payee, value:fee});

    var newBurnerBalance = web3.eth.getBalance(burnerContract);
    assert(newBurnerBalance.eq(oldBurnerBalance.plus(fee)), 'Fee not collected');
  });
});
