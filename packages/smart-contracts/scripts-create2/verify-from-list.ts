import { verifyOne } from './verify-one';
import { create2ContractDeploymentList, HardhatRuntimeEnvironmentExtended } from './utils';
import { computeCreate2DeploymentAddress } from './compute-one-address';

// Verifies the contracts
export default async function VerifyPayments(
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> {
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

    let address: string;
    await Promise.all(
      create2ContractDeploymentList.map(async (contract) => {
        switch (contract) {
          case 'EthereumProxy':
          case 'EthereumFeeProxy':
            address = await computeCreate2DeploymentAddress({ contract: contract }, hre);
            await verifyOne(address, { contract: contract }, hre);
            break;
          // Other cases to add when necessary
          default:
            throw new Error(
              `The contrat ${contract} is not to be deployed using the CREATE2 scheme`,
            );
        }
      }),
    );
  } catch (e) {
    console.error(e);
  }
}
