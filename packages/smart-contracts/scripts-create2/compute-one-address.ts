import { HardhatRuntimeEnvironmentExtended, IDeploymentParams } from './utils';
import { CREATE2_DEPLOYER_ADDRESS as CREATE2_DEPLOYER_ADDRESS_DEFAULT } from 'xdeployer';
import { requestDeployer } from '../src/lib';

// Deploys, set up the contracts
export async function computeOne(
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<string> {
  try {
    if (!hre.config.xdeploy.networks || !hre.config.xdeploy.rpcUrls) {
      throw new Error('Bad network configuration');
    }

    if (!hre.config.xdeploy.salt) {
      throw new Error('Missing salt');
    }

    if (!hre.config.xdeploy.deployerAddress) {
      console.warn('Deployer address is set to default !');
    }

    const deployerAddress = hre.config.xdeploy.deployerAddress
      ? hre.config.xdeploy.deployerAddress
      : CREATE2_DEPLOYER_ADDRESS_DEFAULT;

    const provider = new hre.ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const RequestDeployer = requestDeployer.connect('private', provider);
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
      deployerAddress,
    );
    return computedAddress;
  } catch (e) {
    throw new Error(e.toString());
  }
}
