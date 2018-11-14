const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');

const addressContractBurner = "0xfCb4393e7fAef06fAb01c00d67c1895545AfF3b8";

// Deploys, set up the contracts
module.exports = async function(deployer) {
  try { 
    // Deploy the contract
    await deployer.deploy(RequestHashStorage, addressContractBurner);
    console.log('Contract deployed: ' + RequestHashStorage.address);

    // Initialize basic value
    const instance = await RequestHashStorage.deployed();

    // 450000000000000 wei -> 0.10$
    // 140000000000000 wei -> 0.03$
    // 10000 -> 10kB

    await instance.setFeeParameters('450000000000000', '140000000000000', '10000');
    await instance.setMinimumFeeThreshold('10000');
    await instance.setRequestBurnerContract(addressContractBurner);

    console.log('Contract initialized')
  } catch (e) {
    console.error(e);
  }
};
