var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
	return;
}

var Administrable = artifacts.require("./core/Administrable.sol");
var RequestCore = artifacts.require("./core/RequestCore.sol");
var RequestEthereum = artifacts.require("./synchrone/RequestEthereum.sol");
var RequestBurnManagerSimple = artifacts.require("./collect/RequestBurnManagerSimple.sol");

contract('RequestCore Administrative part', function(accounts) {
	var admin = accounts[0];
	var otherguy = accounts[1];


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
		var requestEthereum = await RequestEthereum.new();

		var r = await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"NewTrustedContract","Event NewTrustedContract is missing after adminAddTrustedCurrencyContract()");
		assert.equal(ev.data[0].toLowerCase(),requestEthereum.address,"Event NewTrustedContract wrong args");
		assert.equal(await requestCore.getStatusContract.call(requestEthereum.address),"1","New contract should be added");
	});
	it("adminRemoveTrustedCurrencyContract remove trusted contract", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});

		var r = await requestCore.adminRemoveTrustedCurrencyContract(requestEthereum.address, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"RemoveTrustedContract","Event RemoveTrustedContract is missing after adminAddTrustedCurrencyContract()");
		assert.equal(ev.data[0].toLowerCase(),requestEthereum.address,"Event RemoveTrustedContract wrong args");
		assert.equal(await requestCore.getStatusContract.call(requestEthereum.address),"0","New contract should be added");
	});

	// adminAddTrustedExtension adminRemoveTrustedCurrencyContract
	it("adminAddTrustedExtension add a new extension as trusted", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		var r = await requestCore.adminAddTrustedExtension(requestEthereum.address, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"NewTrustedExtension","Event NewTrustedExtension is missing after adminAddTrustedExtension()");
		assert.equal(ev.data[0].toLowerCase(),requestEthereum.address,"Event NewTrustedExtension wrong args");
		assert.equal(await requestCore.getStatusExtension.call(requestEthereum.address),"1","New extension should be added");
	});
	it("adminRemoveTrustedCurrencyContract remove trusted contract", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		await requestCore.adminAddTrustedExtension(requestEthereum.address, {from:admin});

		var r = await requestCore.adminRemoveExtension(requestEthereum.address, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"RemoveTrustedExtension","Event RemoveTrustedExtension is missing after adminRemoveExtension()");
		assert.equal(ev.data[0].toLowerCase(),requestEthereum.address,"Event RemoveTrustedExtension wrong args");
		assert.equal(await requestCore.getStatusExtension.call(requestEthereum.address),"0","New extension should be added");
	});



	// right on adminAddTrustedCurrencyContract adminRemoveTrustedCurrencyContract adminAddTrustedExtension adminRemoveExtension
	it("adminAddTrustedCurrencyContract can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		await utils.expectThrow(requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:otherguy}));
	});
	it("adminAddTrustedExtension can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		await utils.expectThrow(requestCore.adminAddTrustedExtension(requestEthereum.address, {from:otherguy}));
	});
	it("adminRemoveTrustedCurrencyContract can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		await requestCore.adminAddTrustedCurrencyContract(requestEthereum.address, {from:admin});
		await utils.expectThrow(requestCore.adminRemoveTrustedCurrencyContract(requestEthereum.address, {from:otherguy}));
	});
	it("adminRemoveExtension can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		var requestEthereum = await RequestEthereum.new();

		await requestCore.adminAddTrustedExtension(requestEthereum.address, {from:admin});
		await utils.expectThrow(requestCore.adminRemoveExtension(requestEthereum.address, {from:otherguy}));
	});




	// right on setBurnManager 
	it("setBurnManager can be done only by admin", async function() {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);

		await utils.expectThrow(requestCore.setBurnManager(requestBurnManagerSimple.address, {from:otherguy}));
	});
	it("setBurnManager", async function() {
		var requestCore = await RequestCore.new();
		var requestBurnManagerSimple = await RequestBurnManagerSimple.new(0);

		var r = await requestCore.setBurnManager(requestBurnManagerSimple.address, {from:admin});
		var ev = utils.getEventFromReceipt(r.receipt.logs[0], Administrable.abi);
		assert.equal(ev.name,"NewBurnManager","Event NewBurnManager is missing after setBurnManager()");
		assert.equal(ev.data[0].toLowerCase(),requestBurnManagerSimple.address,"Event NewBurnManager wrong args");

		assert.equal(await requestCore.trustedNewBurnManager.call(),requestBurnManagerSimple.address,"trustedNewBurnManager is wrong");
	});
});


