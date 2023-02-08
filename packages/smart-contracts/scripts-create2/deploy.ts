import { create2ContractDeploymentList, isContractDeployed } from './utils';
import { HardhatRuntimeEnvironmentExtended, IDeploymentParams } from './types';
import { xdeploy } from './xdeployer';
import { getConstructorArgs } from './constructor-args';
import {
  setupBatchConversionPayments,
  setupChainlinkConversionPath,
  setupErc20ConversionProxy,
  setupERC20SwapToConversion,
  setupERC20SwapToPay,
  setupETHConversionProxy,
} from './contract-setup';
import { EvmChains } from '@requestnetwork/currency';

// Deploys, set up the contracts and returns the address
export const deployOneWithCreate2 = async (
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<string> => {
  if (!hre.config.xdeploy.networks || hre.config.xdeploy.networks.length === 0) {
    throw new Error('Invalid networks');
  }
  // Deploy the contract on several network through xdeployer
  const deploymentResult = await xdeploy(deploymentParams, hre);
  hre.config.xdeploy.networks.forEach((network, i) => {
    if (deploymentResult[i].deployed) {
      console.log(`${deploymentParams.contract} successfully deployed:`);
      console.log(`         On network:        ${network}`);
      console.log(`         At address:        ${deploymentResult[i].address}`);
      console.log(`         At block:          ${deploymentResult[i].receipt.blockNumber}`);
    } else {
      if (isContractDeployed(deploymentParams.contract, network, deploymentResult[i].address)) {
        console.log(`${deploymentParams.contract} already deployed:`);
        console.log(`         On network:        ${network}`);
        console.log(`         At address:        ${deploymentResult[i].address}`);
      } else {
        console.log(`${deploymentParams.contract} has not been deployed:`);
        console.log(`         On network:        ${network}`);
        console.log(`         Error:             ${deploymentResult[i].error}`);
        console.log(
          `         Hint:              Check admin wallet balance and that your artifacts are up to date`,
        );
      }
    }
  });
  return deploymentResult[0].address;
};

export const deployWithCreate2FromList = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  for (const contract of create2ContractDeploymentList) {
    switch (contract) {
      case 'EthereumProxy':
      case 'ERC20FeeProxy':
      case 'EthereumFeeProxy': {
        const constructorArgs = getConstructorArgs(contract);
        await deployOneWithCreate2({ contract, constructorArgs }, hre);
        break;
      }
      case 'ChainlinkConversionPath': {
        const constructorArgs = getConstructorArgs(contract);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        await setupChainlinkConversionPath(address, hre);
        break;
      }
      case 'EthConversionProxy': {
        const constructorArgs = getConstructorArgs(contract);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        await setupETHConversionProxy(address, hre);
        break;
      }
      case 'Erc20ConversionProxy': {
        const constructorArgs = getConstructorArgs(contract);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        await setupErc20ConversionProxy(address, hre);
        break;
      }
      case 'ERC20SwapToPay': {
        const constructorArgs = getConstructorArgs(contract);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        await setupERC20SwapToPay(address, hre);
        break;
      }
      case 'ERC20SwapToConversion': {
        const constructorArgs = getConstructorArgs(contract);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        await setupERC20SwapToConversion(address, hre);
        break;
      }
      case 'ERC20EscrowToPay': {
        const network = hre.config.xdeploy.networks[0];
        EvmChains.assertChainSupported(network);
        const constructorArgs = getConstructorArgs(contract, network);
        await deployOneWithCreate2({ contract, constructorArgs }, hre);
        break;
      }
      case 'BatchConversionPayments': {
        const network = hre.config.xdeploy.networks[0];
        EvmChains.assertChainSupported(network);
        const constructorArgs = getConstructorArgs(contract, network);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        await setupBatchConversionPayments(address, hre);
        break;
      }
      // Other cases to add when necessary
      default:
        throw new Error(`The contract ${contract} is not to be deployed using the CREATE2 scheme`);
    }
  }
};
