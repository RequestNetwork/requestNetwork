import { IDeploymentParams, HardhatRuntimeEnvironmentExtended } from './types';
import { requestDeployer } from '../src/lib';
import { create2ContractDeploymentList } from './utils';

// Deploys, set up the contracts
export async function computeCreate2DeploymentAddress(
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<string> {
  try {
    if (!hre.config.xdeploy.salt) {
      throw new Error('Missing salt');
    }

    if (!hre.config.xdeploy.deployerAddress) {
      throw new Error('Missing deployer address');
    }

    const provider = new hre.ethers.providers.JsonRpcProvider(
      'https://api.avax.network/ext/bc/C/rpc',
    );
    const RequestDeployer = requestDeployer.connect('avalanche', provider);
    const ContractToDeploy = await hre.ethers.getContractFactory(deploymentParams.contract);
    let initcode;
    if (deploymentParams.constructorArgs) {
      initcode = await ContractToDeploy.getDeployTransaction(...deploymentParams.constructorArgs);
    } else {
      initcode = await ContractToDeploy.getDeployTransaction();
    }

    if (!initcode || !initcode.data) {
      throw new Error('Invalid initcode - check your contract and arguments');
    }
    const computedAddress = await RequestDeployer.computeAddressWithDeployer(
      hre.ethers.utils.id(hre.config.xdeploy.salt),
      hre.ethers.utils.keccak256(initcode.data),
      hre.config.xdeploy.deployerAddress,
    );
    return computedAddress;
  } catch (e) {
    throw new Error(e.toString());
  }
}

export const computeCreate2DeploymentAddressesFromList = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  await Promise.all(
    create2ContractDeploymentList.map(async (contract) => {
      let address: string;
      switch (contract) {
        case 'EthereumProxy':
        case 'EthereumFeeProxy':
          address = await computeCreate2DeploymentAddress({ contract }, hre);
          console.log(`${contract.padEnd(36, ' ')}${address}`);
          break;
        // Other cases to add when necessary
        default:
          throw new Error(`The contrat ${contract} is not to be deployed using the CREATE2 scheme`);
      }
    }),
  );
};
