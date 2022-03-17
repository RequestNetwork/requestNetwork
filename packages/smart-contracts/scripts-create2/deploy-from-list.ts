import { deployOneWithCreate2 } from './deploy-one';
import { create2ContractDeploymentList } from './utils';
import { HardhatRuntimeEnvironmentExtended } from './types';

export const deployWithCreate2FromList = async (
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

  for (let i = 0; i < create2ContractDeploymentList.length; i++) {
    const contract = create2ContractDeploymentList[i];
    switch (contract) {
      case 'EthereumProxy':
        await deployOneWithCreate2({ contract: 'EthereumProxy' }, hre);
        break;
      case 'EthereumFeeProxy':
        await deployOneWithCreate2({ contract: 'EthereumFeeProxy' }, hre);
        break;
      // Other cases to add when necessary
      default:
        throw new Error(`The contrat ${contract} is not to be deployed using the CREATE2 scheme`);
    }
  }
};
