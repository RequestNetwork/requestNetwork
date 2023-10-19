import { create2ContractDeploymentList, isContractDeployed } from './utils';
import { HardhatRuntimeEnvironmentExtended, IDeploymentParams } from './types';
import { xdeploy } from './xdeployer';
import { getConstructorArgs } from './constructor-args';
import { EvmChains } from '@requestnetwork/currency';
import { setupContract } from './contract-setup/setups';

/**
 * Deploy a contract on the networks specified in the hardhat config.
 * Use the CREATE2 scheme for the deployments.
 * @param deploymentParams contract and constructor arguments
 * @param hre hardhat runtime environment
 * @returns The address of the deployed contract - same for all network
 */
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

/**
 * Deploy all the contracts specified in create2ContractDeploymentList.
 * Once deployed, do the setup.
 * @param hre
 */
export const deployWithCreate2FromList = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  for (const contract of create2ContractDeploymentList) {
    const network = hre.config.xdeploy.networks[0];
    EvmChains.assertChainSupported(network);
    const constructorArgs = getConstructorArgs(contract, network);
    const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
    await setupContract({ contractAddress: address, contractName: contract, hre });
  }
};
