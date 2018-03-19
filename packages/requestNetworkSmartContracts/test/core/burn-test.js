var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

const BurnContract = artifacts.require("./core/Burn.sol");
const RequestCore = artifacts.require("./core/RequestCore.sol");;

contract('burn contract ', () => {
	// Creation and event
	it("can be created", async function () {
    // Create REQ
    // Create kyberMock
    // Give REQ to kyberMock
    // call burn

		const burnInstance = await BurnContract.new();
		assert.ok(burnInstance.burn, 'Burn contract should have a burn function');
	});
});


