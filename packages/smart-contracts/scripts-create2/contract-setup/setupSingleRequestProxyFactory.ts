import { EvmChains } from '@requestnetwork/currency';
import { singleRequestProxyFactoryArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasFees,
  updateSRPFERC20FeeProxyAddress,
  updateSRPFEthereumFeeProxyAddress,
} from './adminTasks';

/**
 * Setup the SingleRequestProxyFactory values once deployed
 * @param contractAddress address of the SingleRequestProxyFactory contract
 *                        If not provided fallback to the latest deployment address
 * @param hre Hardhat runtime environment
 * @param signWithEoa Are transactions to be signed by an EOA
 */
export const setupSRPF = async ({
  contractAddress,
  hre,
  signWithEoa,
}: {
  contractAddress?: string;
  hre: HardhatRuntimeEnvironmentExtended;
  signWithEoa: boolean;
}): Promise<void> => {
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network: string) => {
      try {
        EvmChains.assertChainSupported(network);
        if (!contractAddress) {
          contractAddress = singleRequestProxyFactoryArtifact.getAddress(network);
        }
        if (!contractAddress) {
          console.warn(`Missing SingleRequestProxyFactory deployment on ${network}`);
          return;
        }

        const factory = new hre.ethers.Contract(
          contractAddress,
          singleRequestProxyFactoryArtifact.getContractAbi(),
        );
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const factoryConnected = factory.connect(signer);

        await updateSRPFERC20FeeProxyAddress(
          factoryConnected,
          network,
          txOverrides,
          signer,
          signWithEoa,
        );
        await updateSRPFEthereumFeeProxyAddress(
          factoryConnected,
          network,
          txOverrides,
          signer,
          signWithEoa,
        );

        console.log(`Setup of SingleRequestProxyFactory successful on ${network}`);
      } catch (err) {
        console.warn(
          `An error occurred during the setup of SingleRequestProxyFactory on ${network}`,
        );
        console.warn(err);
      }
    }),
  );
};
