// Override Promise with bluebird
const Promise = require('bluebird');
const assert = require('assert');

const RequestCore = artifacts.require("./RequestCore.sol");
const RequestEthereum = artifacts.require("./RequestEthereum.sol");
const RequestERC20 = artifacts.require("./RequestERC20.sol");

const addressContractBurner = 0;
const feesPerTenThousand = 10; // 0.1 %
const maxFees = web3.toWei(0.00012, 'ether');

// Deploys, set up the contracts
module.exports = async function(deployer) {
  await deployer.deploy(RequestCore);
  await deployer.deploy(RequestEthereum, RequestCore.address, addressContractBurner);
  await deployer.deploy(RequestERC20, RequestCore.address, addressContractBurner);
  const instances = await createInstances();
  await setupContracts(instances);
  await checks(instances);
  
  console.log('Contract deployed, checks complete');
};

function createInstances() {
  return Promise.props({
    core: RequestCore.deployed(),
    ethereum: RequestEthereum.deployed(),
    erc20: RequestERC20.deployed()
  });
}

function setupContracts({ ethereum: ethereumInstance, core: coreInstance, erc20: erc20Instance }) {
  return Promise.all([
    coreInstance.adminAddTrustedCurrencyContract(ethereumInstance.address),
    ethereumInstance.setFeesPerTenThousand(feesPerTenThousand),
    ethereumInstance.setMaxCollectable(maxFees),
  ]);
}

// Execute some assertions to ensure the contract are correctly deployed and set up
function checks({ ethereum: ethereumInstance, core: coreInstance }) {
  return Promise.all([
    coreInstance.getStatusContract(ethereumInstance.address).then(status => {
      assert(status.toNumber() === 1, 'Ethereum contract should be trusted in Core')
    }),

    ethereumInstance.feesPer10000.call().then(feesPer10000fromContract => {
      assert(feesPer10000fromContract.toNumber() === feesPerTenThousand, `Ethereum contract fees should be ${feesPerTenThousand}`)
    }),

    ethereumInstance.maxFees.call().then(maxFeesFromContract => {
      assert(maxFeesFromContract.toString() === maxFees, `Ethereum contract maxfees should be ${maxFees}`)
    })
  ]);
}
