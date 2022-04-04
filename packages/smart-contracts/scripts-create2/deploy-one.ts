import { create2ContractDeploymentList, isContractDeployed } from './utils';
import { IDeploymentParams } from './types';
import { HardhatRuntimeEnvironmentExtended } from './types';
import { xdeploy } from './xdeployer';
import { getConstructorArgs } from './constructor-args';

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
  for (let i = 0; i < hre.config.xdeploy.networks.length; i++) {
    if (deploymentResult[i].deployed) {
      console.log(`${deploymentParams.contract} succesffuly deployed:`);
      console.log(`         On network:        ${hre.config.xdeploy.networks[i]}`);
      console.log(`         At address:        ${deploymentResult[i].address}`);
      console.log(`         At block:          ${deploymentResult[i].receipt.blockNumber}`);
    } else {
      if (
        isContractDeployed(
          deploymentParams.contract,
          hre.config.xdeploy.networks[i],
          deploymentResult[i].address,
        )
      ) {
        console.log(`${deploymentParams.contract} already deployed:`);
        console.log(`         On network:        ${hre.config.xdeploy.networks[i]}`);
        console.log(`         At address:        ${deploymentResult[i].address}`);
      } else {
        console.log(`${deploymentParams.contract} has not been deployed:`);
        console.log(`         On network:        ${hre.config.xdeploy.networks[i]}`);
        console.log(`         Error:             ${deploymentResult[i].error}`);
        console.log(
          `         Hint:              Check admin wallet balance and that your artifacts are up to date`,
        );
      }
    }
  }
  return deploymentResult[0].address;
};

export const deployWithCreate2FromList = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  for (const contract of create2ContractDeploymentList) {
    switch (contract) {
      case 'EthereumProxy':
      case 'EthereumFeeProxy':
      case 'Erc20ConversionProxy': {
        const constructorArgs = getConstructorArgs(contract);
        await deployOneWithCreate2({ contract, constructorArgs }, hre);
        break;
      }
      case 'ERC20SwapToConversion': {
        const constructorArgs = getConstructorArgs(contract);
        const address = await deployOneWithCreate2({ contract, constructorArgs }, hre);
        break;
      }
      // Other cases to add when necessary
      default:
        throw new Error(`The contrat ${contract} is not to be deployed using the CREATE2 scheme`);
    }
  }
};
