const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');
const RequestOpenHashSubmitter = artifacts.require('./RequestOpenHashSubmitter.sol');
const erc20 = artifacts.require('./TestERC20.sol');
const ERC20Proxy = artifacts.require('./ERC20Proxy.sol');

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

    // Deploy the ERC20 contract
    await deployer.deploy(erc20, 1000); // 1000 initial supply

    // Deploy ERC20 proxy contract
    await deployer.deploy(ERC20Proxy);

    console.log('Contracts initialized');
  } catch (e) {
    console.error(e);
  }
};
