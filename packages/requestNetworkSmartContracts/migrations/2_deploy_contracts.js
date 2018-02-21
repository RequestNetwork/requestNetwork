var RequestCore = artifacts.require("./RequestCore.sol");
var RequestEthereum = artifacts.require("./RequestEthereum.sol");

var addressContractBurner = 0;
var feesPerTenThousand = 10; // 0.1 %


var requestCore;
var requestEthereum;
module.exports = function(deployer) {
    deployer.deploy(RequestCore).then(function() {
        return deployer.deploy(RequestEthereum, RequestCore.address).then(function() {
            createInstances().then(function() {
                setupContracts().then(function() {
                    checks()
                });
            });
        });
    });
};

var createInstances = function() {
    return RequestCore.deployed().then(function(instance) {
        requestCore = instance;
        return RequestEthereum.deployed().then(function(instance) {
            requestEthereum = instance;
            console.log("Instances set.")
        });
    });
}

var setupContracts = function() {
    return requestCore.adminAddTrustedCurrencyContract(requestEthereum.address).then(function() {
        console.log("Contracts set up.")
    });
}

var checks = function() {
  requestCore.getStatusContract(requestEthereum.address).then(function(d) {
    console.log("getStatusContract: " + requestEthereum.address + " => " + d)
    console.log("Checks complete")
  });
}
