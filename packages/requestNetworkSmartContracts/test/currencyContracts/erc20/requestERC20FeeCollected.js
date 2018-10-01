var config = require("../../config.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");


contract('RequestERC20 Fee collected', function(accounts) {
  var admin = accounts[0];
	var burnerContract = accounts[1];

	var payerRefund = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];

	var payeePayment = accounts[5];

	var requestCore;
	var requestERC20;
	var testToken;

  var minterAmount = '1000000000000000000';
	var arbitraryAmount = 1000000000000000;


  beforeEach(async () => {
    testToken = await TestToken.new(payerRefund, minterAmount);
		requestCore = await RequestCore.new();
		requestERC20 = await RequestERC20.new(requestCore.address, burnerContract, testToken.address, {from:admin});
		await requestCore.adminAddTrustedCurrencyContract(requestERC20.address, {from:admin});
    await requestERC20.setRateFees(1, 1000, {from:admin}); // 0.1%
		await requestERC20.setMaxCollectable('2000000000000000', {from:admin}); // 0.002 ether
	});

  it("fee collected", async function () {
    var oldBurnerBalance = web3.eth.getBalance(burnerContract);
    var fee = await requestERC20.collectEstimation(arbitraryAmount);
    var r = await requestERC20.createRequestAsPayeeAction(
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
