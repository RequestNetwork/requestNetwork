var config = require("../config.js");
var utils = require("../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
    return;
}
var RequestCollectInterface = artifacts.require("./core/RequestCollectInterface.sol");

var BigNumber = require('bignumber.js');


contract('RequestCollectInterface', function(accounts) {
    var admin = accounts[0];
    var otherguy = accounts[1];
    var fakeContract = accounts[2];
    var payer = accounts[3];
    var payee = accounts[4];
    var creator = accounts[5];
    var payee2 = accounts[6];
    var contractForBurning = accounts[7];
    var contractForBurning2 = accounts[8];

    var arbitraryFeesNumerator = 2;
    var arbitraryFeesDenominator = 1000;
    var arbitraryMaxFee = 500;


    var expectedAmountverySmall = 5;
    var expectedAmountOverMaxFees = 900000000000;
    var expectedAmountUnderMaxFees = 70000;

    var requestCollectInterface;


    beforeEach(async () => {
        requestCollectInterface = await RequestCollectInterface.new(contractForBurning);
    })


    // requestId start at 1 when Core is created
    it("creates with requestBurnerContract", async function () {
        assert.equal(await requestCollectInterface.requestBurnerContract.call(),contractForBurning,"requestBurnerContract wrong");
    });

    it("updates requestBurnerContract", async function () {
        await requestCollectInterface.setRequestBurnerContract(contractForBurning2);
        assert.equal(await requestCollectInterface.requestBurnerContract.call(),contractForBurning2,"requestBurnerContract wrong");
    });

    it("updates Rate Fees", async function () {
        var r = await requestCollectInterface.setRateFees(arbitraryFeesNumerator, arbitraryFeesDenominator);
        assert.equal(r.logs[0].event,"UpdateRateFees","Event UpdateRateFees is missing");
        assert.equal(r.logs[0].args.rateFeesNumerator,arbitraryFeesNumerator,"rateFeesNumerator wrong on event");
        assert.equal(r.logs[0].args.rateFeesDenominator,arbitraryFeesDenominator,"rateFeesDenominator wrong on event");

        assert.equal(await requestCollectInterface.rateFeesNumerator.call(),arbitraryFeesNumerator,"rateFeesNumerator wrong");
        assert.equal(await requestCollectInterface.rateFeesDenominator.call(),arbitraryFeesDenominator,"rateFeesDenominator wrong");
    });

    it("updates Max Fees", async function () {
        var r = await requestCollectInterface.setMaxCollectable(arbitraryMaxFee);
        assert.equal(r.logs[0].event,"UpdateMaxFees","Event UpdateMaxFees is missing");
        assert.equal(r.logs[0].args.maxFees,arbitraryMaxFee,"maxFees wrong on event");

        assert.equal(await requestCollectInterface.maxFees.call(),arbitraryMaxFee,"maxFees wrong");
    });

    it("estimate fee with no fees", async function () {
        var fees = await requestCollectInterface.collectEstimation(expectedAmountUnderMaxFees);
        assert.equal(fees,0,"fees wrong");
    });

    it("estimates fee under max fees", async function () {
        await requestCollectInterface.setRateFees(arbitraryFeesNumerator, arbitraryFeesDenominator);
        await requestCollectInterface.setMaxCollectable(arbitraryMaxFee);

        var fees = await requestCollectInterface.collectEstimation(expectedAmountUnderMaxFees);

        assert.equal(fees,(expectedAmountUnderMaxFees * arbitraryFeesNumerator) / arbitraryFeesDenominator,"fees wrong");
    });

    it("estimates fee over max fees", async function () {
        await requestCollectInterface.setRateFees(arbitraryFeesNumerator, arbitraryFeesDenominator);
        await requestCollectInterface.setMaxCollectable(arbitraryMaxFee);

        var fees = await requestCollectInterface.collectEstimation(expectedAmountOverMaxFees);

        assert.equal(fees,arbitraryMaxFee,"fees wrong");
    });


    it("estimates fee with rateFeesDenominator == 0", async function () {
        await requestCollectInterface.setRateFees(arbitraryFeesNumerator, 0);
        await requestCollectInterface.setMaxCollectable(arbitraryMaxFee);

        var fees = await requestCollectInterface.collectEstimation(expectedAmountverySmall);

        assert.equal(fees,expectedAmountverySmall * arbitraryFeesNumerator,"fees wrong");
    });
});

