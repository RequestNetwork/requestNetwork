var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestERC20 = artifacts.require("./synchrone/RequestERC20.sol");
var TestToken = artifacts.require("./test/synchrone/TestToken.sol");

// contract for test
var BigNumber = require('bignumber.js');

contract('RequestERC20 updateTokens',  function(accounts) {
	var admin = accounts[0];
	var burnerContract = accounts[1];

	var payerRefund = accounts[2];
	var payer = accounts[3];
	var payee = accounts[4];
	var payee2 = accounts[5];
	var payee3 = accounts[6];

	var fakeTokenAddress = accounts[7];
	var fakeToken2Address = accounts[8];
	var fakeToken3Address = accounts[9];

	var requestCore;
	var requestERC20;
	var testToken;

	var minterAmount = '1000000000000000000';
	var arbitraryAmount = 100000;
	var arbitraryAmount2 = 20000;
	var arbitraryAmount3 = 30000;

	beforeEach(async () => {
		testToken = await TestToken.new(payerRefund, minterAmount);
		requestCore = await RequestCore.new({from:admin});
		requestERC20 = await RequestERC20.new(requestCore.address, burnerContract, {from:admin});
	});

	it("update tokens", async function () {
		const addressToken = 				[fakeTokenAddress, fakeToken2Address, fakeToken3Address];
		const rateFeesNumerator = 	[1, 50, 100];
		const rateFeesDenominator = [1000, 5000, 9999];
		const newMaxFees = 					['2000000000000000','3000000000000000','5000000000000000']; // 0.002 0.003 0.005 ether
		const whitelisted = 				[true,false,true];
		const r = await requestERC20.updateTokens(addressToken, rateFeesNumerator, rateFeesDenominator, newMaxFees, whitelisted);


		assert.equal(r.receipt.logs.length,3,"Wrong number of events");
		for(let i=0; i< addressToken.length; i++) {
			var l = utils.getEventFromReceipt(r.receipt.logs[i], requestERC20.abi);
			assert.equal(l.name,"UpdateTokens","Event UpdateTokens is missing after updateTokens()");
			assert.equal(utils.bytes32StrToAddressStr(r.receipt.logs[i].topics[1]),addressToken[i],"Event UpdateTokens wrong args");
			assert.equal(l.data[0],rateFeesNumerator[i],"Event UpdateTokens wrong args rateFeesNumerator");
			assert.equal(l.data[1],rateFeesDenominator[i],"Event UpdateTokens wrong args rateFeesDenominator");
			assert.equal(l.data[2],newMaxFees[i],"Event UpdateTokens wrong args newMaxFees");
			assert.equal(l.data[3],whitelisted[i],"Event UpdateTokens wrong args whitelisted");
		}

		for(let i=0; i< addressToken.length; i++) {
			const r = await requestERC20.tokensWhiteList(addressToken[i]);
			assert.equal(r[0],rateFeesNumerator[i],"tokensWhiteList wrong args rateFeesNumerator");
			assert.equal(r[1],rateFeesDenominator[i],"tokensWhiteList wrong args rateFeesDenominator");
			assert.equal(r[2],newMaxFees[i],"tokensWhiteList wrong args newMaxFees");
			assert.equal(r[3],whitelisted[i],"tokensWhiteList wrong args whitelisted");
		}
		
	});

});

