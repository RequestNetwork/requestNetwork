const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');
const RequestOpenHashSubmitter = artifacts.require('./RequestOpenHashSubmitter.sol');
const ERC20Proxy = artifacts.require('./ERC20Proxy.sol');
const EthereumProxy = artifacts.require('./EthereumProxy.sol');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');

const erc20 = artifacts.require('./TestERC20.sol');
const BadERC20 = artifacts.require('./BadERC20.sol');
const ERC20True = artifacts.require('ERC20True');
const ERC20False = artifacts.require('ERC20False');
const ERC20NoReturn = artifacts.require('ERC20NoReturn');
const ERC20Revert = artifacts.require('ERC20Revert');

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
    console.log('ERC20Proxy Contract deployed: ' + ERC20Proxy.address);

    // create some events for test purpose
    await instanceTestERC20.approve(ERC20Proxy.address, 110);
    await instanceRequestERC20Proxy.transferFromWithReference(
      instanceTestERC20.address,
      '0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc',
      100,
      '0x7157f6ce9085a520',
    );
    await instanceRequestERC20Proxy.transferFromWithReference(
      instanceTestERC20.address,
      '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE',
      10,
      '0xdeea051f2e9120e0',
    );

    // Deploy Ethereym proxy contract
    await deployer.deploy(EthereumProxy);
    console.log('EthereumProxy Contract deployed: ' + EthereumProxy.address);

    // Deploy ERC20 Fee proxy contract
    await deployer.deploy(ERC20FeeProxy);
    console.log('ERC20FeeProxy Contract deployed: ' + ERC20FeeProxy.address);

    // Deploy the BadERC20 contract
    await deployer.deploy(BadERC20, 1000, 'BadERC20', 'BAD', 8);
    console.log('BadERC20 Contract deployed: ' + BadERC20.address);

    // Deploy test ERC20 contracts
    await deployer.deploy(ERC20True);
    console.log('ERC20True Contract deployed: ' + ERC20True.address);

    await deployer.deploy(ERC20False);
    console.log('ERC20False Contract deployed: ' + ERC20False.address);

    await deployer.deploy(ERC20NoReturn);
    console.log('ERC20NoReturn Contract deployed: ' + ERC20NoReturn.address);

    await deployer.deploy(ERC20Revert);
    console.log('ERC20Revert Contract deployed: ' + ERC20Revert.address);

    // ----------------------------------
    console.log('Contracts initialized');
    console.log(`
      RequestHashStorage:       ${RequestHashStorage.address}
      RequestOpenHashSubmitter: ${RequestOpenHashSubmitter.address}
      TestERC20:                ${erc20.address}
      ERC20Proxy:               ${ERC20Proxy.address}
      EthereumProxy:            ${EthereumProxy.address}
      ERC20FeeProxy:            ${ERC20FeeProxy.address}
      BadERC20:                 ${BadERC20.address}
      ERC20True:                ${ERC20True.address}
      ERC20False:               ${ERC20False.address}
      ERC20NoReturn:            ${ERC20NoReturn.address}
      ERC20Revert:              ${ERC20Revert.address}
    `);
  } catch (e) {
    console.error(e);
  }
};
