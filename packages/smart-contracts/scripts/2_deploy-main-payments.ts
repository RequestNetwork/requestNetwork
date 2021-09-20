import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
export default async function deploy(args: any, hre: HardhatRuntimeEnvironment) {
  try {
    const [deployer] = await hre.ethers.getSigners();

    console.log(
      `Deploying with the account: ${deployer.address} on the network ${hre.network.name} (${hre.network.config.chainId})`,
    );

    const erc20Factory = await hre.ethers.getContractFactory('TestERC20');

    // Deploy the ERC20 contract
    const testERC20Instance = await erc20Factory.deploy('1000000000000000000000000000000');

    // Deploy ERC20 proxy contract
    const instanceRequestERC20Proxy = await (
      await hre.ethers.getContractFactory('ERC20Proxy')
    ).deploy();
    console.log('ERC20Proxy Contract deployed: ' + instanceRequestERC20Proxy.address);

    // create some events for test purpose
    await testERC20Instance.approve(instanceRequestERC20Proxy.address, 110);
    await instanceRequestERC20Proxy.transferFromWithReference(
      testERC20Instance.address,
      '0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc',
      100,
      '0x7157f6ce9085a520',
    );
    await instanceRequestERC20Proxy.transferFromWithReference(
      testERC20Instance.address,
      '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE',
      10,
      '0xdeea051f2e9120e0',
    );

    // Deploy Ethereym proxy contract
    const EthereumProxyAddress = await deployOne(args, hre, 'EthereumProxy');
    console.log('EthereumProxy Contract deployed: ' + EthereumProxyAddress);

    // Deploy ERC20 Fee proxy contract
    const ERC20FeeProxyAddress = await deployOne(args, hre, 'ERC20FeeProxy');
    console.log('ERC20FeeProxy Contract deployed: ' + ERC20FeeProxyAddress);

    // Deploy the BadERC20 contract
    const BadERC20Address = await deployOne(args, hre, 'BadERC20', [1000, 'BadERC20', 'BAD', 8]);
    console.log('BadERC20 Contract deployed: ' + BadERC20Address);

    // Deploy test ERC20 contracts
    const ERC20TrueAddress = await deployOne(args, hre, 'ERC20True');
    console.log('ERC20True Contract deployed: ' + ERC20TrueAddress);

    const ERC20FalseAddress = await deployOne(args, hre, 'ERC20False');
    console.log('ERC20False Contract deployed: ' + ERC20FalseAddress);

    const ERC20NoReturnAddress = await deployOne(args, hre, 'ERC20NoReturn');
    console.log('ERC20NoReturn Contract deployed: ' + ERC20NoReturnAddress);

    const ERC20Revert = await (
      await hre.ethers.getContractFactory('ERC20Revert', deployer)
    ).deploy();
    console.log('ERC20Revert Contract deployed: ' + ERC20Revert.address);

    // Swap-to-pay related contracts
    // Payment erc20: ALPHA
    const erc20AlphaInstance = await erc20Factory.deploy('1000000000000000000000000000000');
    // Mock a swap router
    const FakeSwapRouterAddress = await deployOne(args, hre, 'FakeSwapRouter');
    // 1 ERC20 = 2 ALPHA
    await erc20AlphaInstance.transfer(FakeSwapRouterAddress, '20000000000000000000000000000');
    await testERC20Instance.transfer(FakeSwapRouterAddress, '10000000000000000000000000000');
    // SwapToPay
    const ERC20SwapToPayAddress = await deployOne(args, hre, 'ERC20SwapToPay', [
      FakeSwapRouterAddress,
      ERC20FeeProxyAddress,
    ]);
    // FIXME SwapToPay deployed without approbation for router and proxy
    console.log('SwapToPay Contract deployed: ' + ERC20SwapToPayAddress);
    // FIXME useless transaction to keep the same contract addresses
    await testERC20Instance.transfer(deployer.address, '1');

    // Deploy Ethereym fee proxy contract
    const EthereumFeeProxyAddress = await deployOne(args, hre, 'EthereumFeeProxy');
    console.log('EthereumFeeProxy Contract deployed: ' + EthereumFeeProxyAddress);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      TestERC20:                ${testERC20Instance.address}
      ERC20Proxy:               ${instanceRequestERC20Proxy.address}
      EthereumProxy:            ${EthereumProxyAddress}
      EthereumFeeProxyAddress:  ${EthereumFeeProxyAddress}
      ERC20FeeProxy:            ${ERC20FeeProxyAddress}
      BadERC20:                 ${BadERC20Address}
      ERC20True:                ${ERC20TrueAddress}
      ERC20False:               ${ERC20FalseAddress}
      ERC20NoReturn:            ${ERC20NoReturnAddress}
      ERC20Revert:              ${ERC20Revert.address}
      ERC20Alpha:               ${erc20AlphaInstance.address}
      TestERC20:                ${testERC20Instance.address}
      FakeSwapRouter:           ${FakeSwapRouterAddress}
      SwapToPay:                ${ERC20SwapToPayAddress}
      `);
  } catch (e) {
    console.error(e);
  }
}
