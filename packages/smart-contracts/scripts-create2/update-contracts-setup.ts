import { create2ContractDeploymentList } from './utils.js';
import { HardhatRuntimeEnvironmentExtended } from './types.js';
import { setupContract } from './contract-setup/setups.js';

/**
 * Update the contract latest version registered in the artifacts.
 * @param hre Hardhat runtime environment
 */
export const updateContractsFromList = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  for (const contract of create2ContractDeploymentList) {
    await setupContract({
      contractName: contract,
      hre,
    });
  }
};
