var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var Administrable = artifacts.require("./core/Administrable.sol");
var RequestCore = artifacts.require("./core/RequestCore.sol");;


contract('RequestCore Administrative part', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];
	var fakeContract = accounts[2];
	// Creation and event
	it("Creation Core, pause, unpause", async function () {
		var requestCore = await RequestCore.new();
		assert.equal(await requestCore.paused.call(),false,"Core must not be paused at the begging");

		var r = await requestCore.pause({from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"Pause","Event Pause is missing after pause()");
		assert.equal(await requestCore.paused.call(),true,"Core must be Paused after pause()");

		var r = await requestCore.unpause({from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"Unpause","Event Unpause is missing after unpause()");
		assert.equal(await requestCore.paused.call(),false,"Core must not be paused after unpause()");
	});

	// right to resume, pause
	it("Core cannot be pause by someone else than admin", async function() {
		var requestCore = await RequestCore.new();
		await utils.expectThrow(requestCore.pause({from:otherguy}));
		assert.equal(await requestCore.paused.call(),false,"Core must remain not Paused");
	});
	it("Core cannot be unpause by someone else than admin", async function() {
		var requestCore = await RequestCore.new();
		var r = await requestCore.pause({from:admin});
		await utils.expectThrow(requestCore.unpause({from:otherguy}));
		assert.equal(await requestCore.paused.call(),true,"Core must remain Paused");
	});

	// adminAddTrustedCurrencyContract adminRemoveTrustedCurrencyContract
	it("adminAddTrustedCurrencyContract add a new contract as trusted", async function() {
		var requestCore = await RequestCore.new();

		var r = await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"NewTrustedContract","Event NewTrustedContract is missing after adminAddTrustedCurrencyContract()");
		assert.equal(ev.data[0].toLowerCase(),fakeContract,"Event NewTrustedContract wrong args");
		assert.equal(await requestCore.getStatusContract.call(fakeContract),"1","New contract should be added");
	});
	it("adminRemoveTrustedCurrencyContract remove trusted contract", async function() {
		var requestCore = await RequestCore.new();
		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});

		var r = await requestCore.adminRemoveTrustedCurrencyContract(fakeContract, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"RemoveTrustedContract","Event RemoveTrustedContract is missing after adminAddTrustedCurrencyContract()");
		assert.equal(ev.data[0].toLowerCase(),fakeContract,"Event RemoveTrustedContract wrong args");
		assert.equal(await requestCore.getStatusContract.call(fakeContract),"0","New contract should be added");
	});

	// right on adminAddTrustedCurrencyContract adminRemoveTrustedCurrencyContract
	it("adminAddTrustedCurrencyContract can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		await utils.expectThrow(requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:otherguy}));
	});
	it("adminRemoveTrustedCurrencyContract can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		await requestCore.adminAddTrustedCurrencyContract(fakeContract, {from:admin});
		await utils.expectThrow(requestCore.adminRemoveTrustedCurrencyContract(fakeContract, {from:otherguy}));
	});
});
