import { EvmChains } from '@requestnetwork/currency';
import { singleRequestForwarderFactoryArtifact } from '../../src/lib';
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
          contractAddress = singleRequestForwarderFactoryArtifact.getAddress(network);
        }
        if (!contractAddress) {
          console.warn(`Missing SingleRequestForwarderFactory deployment on ${network}`);
          return;
        }

        const factory = new hre.ethers.Contract(
          contractAddress,
          singleRequestForwarderFactoryArtifact.getContractAbi(),
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

        console.log(`Setup of SingleRequestForwarderFactory successful on ${network}`);
      } catch (err) {
        console.warn(
          `An error occurred during the setup of SingleRequestForwarderFactory on ${network}`,
        );
        console.warn(err);
      }
    }),
  );
};
