const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');
const RequestOpenHashSubmitter = artifacts.require('./RequestOpenHashSubmitter.sol');

const addressContractBurner = '0xfCb4393e7fAef06fAb01c00d67c1895545AfF3b8';

// Deploys, set up the contracts
module.exports = async function(deployer) {
  try {
    // Deploy the contract RequestHashStorage
    await deployer.deploy(RequestHashStorage);
    console.log('RequestHashStorage Contract deployed: ' + RequestHashStorage.address);

    // Deploy the contract RequestOpenHashSubmitter
    await deployer.deploy(
      RequestOpenHashSubmitter,
      RequestHashStorage.address,
      addressContractBurner,
    );
    console.log('RequestOpenHashSubmitter Contract deployed: ' + RequestOpenHashSubmitter.address);

    // Whitelist the requestSubmitter in requestHashDeclaration
    const instanceRequestHashStorage = await RequestHashStorage.deployed();
    instanceRequestHashStorage.addWhitelisted(RequestOpenHashSubmitter.address);
    console.log('requestSubmitter Whitelisted in requestHashDeclaration');

    console.log('Contracts initialized');
  } catch (e) {
    console.error(e);
  }
};
