// Override Promise with bluebird
const Promise = require('bluebird');
const assert = require('assert');

const RequestCore = artifacts.require("./RequestCore.sol");
const RequestEthereum = artifacts.require("./RequestEthereum.sol");
const RequestERC20 = artifacts.require("./RequestERC20.sol");

const addressContractBurner = "0xfCb4393e7fAef06fAb01c00d67c1895545AfF3b8";
const feesPerTenThousand = 10; // 0.1 %
const maxFees = web3.toWei(0.002, 'ether');

// Deploys, set up the contracts
module.exports = async function(deployer) {
    try {
        await deployer.deploy(RequestCore);
        await deployer.deploy(RequestEthereum, RequestCore.address, addressContractBurner);
        const instances = await createInstances();
        await setupContracts(instances);
        await checks(instances);
        console.log('Contract deployed, checks complete');
    }
    catch(e) {
        console.error(e);
    }  
};

function createInstances() {
  return Promise.props({
    core: RequestCore.deployed(),
    ethereum: RequestEthereum.deployed()
  });
}

function setupContracts({ ethereum: ethereumInstance, core: coreInstance }) {
  return Promise.all([
    coreInstance.adminAddTrustedCurrencyContract(ethereumInstance.address),
    ethereumInstance.setRateFees(feesPerTenThousand, 10000),
    ethereumInstance.setMaxCollectable(maxFees),
  ]);
}

// Execute some assertions to ensure the contract are correctly deployed and set up
function checks({ ethereum: ethereumInstance, core: coreInstance }) {
  return Promise.all([
    coreInstance.getStatusContract(ethereumInstance.address).then(status => {
      assert(status.toNumber() === 1, 'Ethereum contract should be trusted in Core')
    }),

    ethereumInstance.rateFeesNumerator.call().then(rateFeesNumeratorfromContract => {
      assert(rateFeesNumeratorfromContract.toNumber() === feesPerTenThousand, `Ethereum contract fees should be ${feesPerTenThousand}`)
    }),

    ethereumInstance.maxFees.call().then(maxFeesFromContract => {
      assert(maxFeesFromContract.toString() === maxFees, `Ethereum contract maxfees should be ${maxFees}`)
    })
  ]);
}
