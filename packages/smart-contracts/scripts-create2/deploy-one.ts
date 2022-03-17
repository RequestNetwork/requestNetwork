import { isContractDeployed } from './utils';
import { IDeploymentParams } from './types';
import { HardhatRuntimeEnvironmentExtended } from './types';
import { xdeploy } from './xdeployer';

// Deploys, set up the contracts
export const deployOneWithCreate2 = async (
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<string> => {
  try {
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
          console.log(`         Error:             ${deploymentResult[i].error?.message}`);
          console.log(`         Hint:              Check that your artefacts are up to date`);
        }
      }
    }
    return deploymentResult[0].address;
  } catch (e) {
    throw new Error(e.toString());
  }
};
