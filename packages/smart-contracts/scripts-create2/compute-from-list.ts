import { computeOne } from './compute-one-address';
import { create2ContractDeploymentList, HardhatRuntimeEnvironmentExtended } from './utils';

export const computeFromList = async (hre: HardhatRuntimeEnvironmentExtended): Promise<void> => {
  if (!hre.config.xdeploy.networks || !hre.config.xdeploy.rpcUrls) {
    throw new Error('Bad network configuration');
  }

  if (!hre.config.xdeploy.salt) {
    throw new Error('Missing salt');
  }

  if (!hre.config.xdeploy.deployerAddress) {
    console.warn('Deployer address is set to default !');
  }

  await Promise.all(
    create2ContractDeploymentList.map(async (contract) => {
      switch (contract) {
        case 'EthereumProxy':
          await computeOne({ contract: 'EthereumProxy' }, hre);
          break;
        case 'EthereumFeeProxy':
          await computeOne({ contract: 'EthereumFeeProxy' }, hre);
          break;
        // Other cases to add when necessary
        default:
          throw new Error(`The contrat ${contract} is not to be deployed using the CREATE2 scheme`);
      }
    }),
  );
};
