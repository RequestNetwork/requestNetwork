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
    await instanceRequestHashStorage.addWhitelisted(RequestOpenHashSubmitter.address);
    console.log('requestSubmitter Whitelisted in requestHashDeclaration');

    // Deploy the ERC20 contract
    const instanceTestERC20 = await deployer.deploy(erc20, 1000); // 1000 initial supply

    // Deploy ERC20 proxy contract
    const instanceRequestERC20Proxy = await deployer.deploy(ERC20Proxy);

    // create some events for test purpose
    await instanceTestERC20.approve(ERC20Proxy.address, 110);
    await instanceRequestERC20Proxy.transferFromWithReference(
      instanceTestERC20.address,
      '0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc',
      100,
      '0x152191b6ec81c20c',
    );
    await instanceRequestERC20Proxy.transferFromWithReference(
      instanceTestERC20.address,
      '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE',
      10,
      '0x0690ebf9d9f17132',
    );
    // ----------------------------------

    console.log('Contracts initialized');
  } catch (e) {
    console.error(e);
  }
};
