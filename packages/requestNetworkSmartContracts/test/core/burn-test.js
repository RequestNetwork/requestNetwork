var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

const BigNumber = require('bignumber.js');

const BurnContract = artifacts.require("./core/Burn.sol");
const RequestToken = artifacts.require("./test/RequestToken.sol");
const KyberContract = artifacts.require("./test/vendor/KyberMock.sol");

contract('burn contract ', accounts => {
  const admin = accounts[0];

	// Creation and event
	it("converts the ETH and burn the REQ", async function () {
    // Create 1000 REQ
    const reqInstance = await RequestToken.new(
      1000,
      0,
      admin,
      admin,
    );

    // Create kyberMock
    const kyberInstance = await KyberContract.new();
    
    // Give 100 REQ (/e+18) to kyberMock
    reqInstance.transfer(kyberInstance.address, 100);

    // Create burn contract
    const burnInstance = await BurnContract.new(reqInstance.address, kyberInstance.address);
    
    // Send 100 ETH (/e+18) to burn contract (simulates Request creation fees)
    await burnInstance.send(100);
    
    // Call burn. It will burn all 100 ETH
    await burnInstance.doBurn(0,0,0);

    // Check REQ burn. REQ supply should now be (1000 - 100) REQ
    const initialSupply = new BigNumber(10).pow(18).times(1000);
    const totalSupply = await reqInstance.totalSupply();

    assert.ok(totalSupply.plus(100).eq(initialSupply));
	});
});


