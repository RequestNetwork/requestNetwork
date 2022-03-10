import { HardhatRuntimeEnvironmentExtended, IDeploymentParams } from './utils';

export const verifyOne = async (
  contractAddress: string,
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: deploymentParams.constructorArgs,
    });
  } catch (err) {
    console.log(err);
  }
};
