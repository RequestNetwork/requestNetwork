import { computeCreate2DeploymentAddress } from './compute-one-address';
import { create2ContractDeploymentList, HardhatRuntimeEnvironmentExtended } from './utils';

export const computeCreate2DeploymentAddressesFromList = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
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
      let address: string;
      switch (contract) {
        case 'EthereumProxy':
          address = await computeCreate2DeploymentAddress({ contract: 'EthereumProxy' }, hre);
          console.log(`EthereumProxy                ${address}`);
          break;
        case 'EthereumFeeProxy':
          address = await computeCreate2DeploymentAddress({ contract: 'EthereumFeeProxy' }, hre);
          console.log(`EthereumFeeProxy             ${address}`);
          break;
        // Other cases to add when necessary
        default:
          throw new Error(`The contrat ${contract} is not to be deployed using the CREATE2 scheme`);
      }
    }),
  );
};
