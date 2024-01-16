import { erc20SwapConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasFees,
  updateChainlinkConversionPath,
  updateRequestSwapFees,
  updateSwapRouter,
} from './adminTasks';
import { EvmChains } from '@requestnetwork/currency';

/**
 * Updates the values of the chainlinkConversionPath and swap router of the ERC20SwapToConversion contract
 * @param contractAddress address of the ERC20SwapToConversion contract
 *                        If not provided fallback to the latest deployment address
 * @param hre Hardhat runtime environment
 * @param signWithEoa Are transactions to be signed by an EAO
 */
export const setupERC20SwapToConversion = async ({
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
          contractAddress = erc20SwapConversionArtifact.getAddress(network);
        }
        const ERC20SwapToConversionContract = new hre.ethers.Contract(
          contractAddress,
          erc20SwapConversionArtifact.getContractAbi(),
        );
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const ERC20SwapToConversionConnected = await ERC20SwapToConversionContract.connect(signer);

        await updateChainlinkConversionPath(
          ERC20SwapToConversionConnected,
          network,
          txOverrides,
          signer,
          signWithEoa,
        );
        await updateSwapRouter(
          ERC20SwapToConversionConnected,
          network,
          txOverrides,
          signer,
          signWithEoa,
        );
        await updateRequestSwapFees(
          ERC20SwapToConversionConnected,
          network,
          txOverrides,
          signer,
          signWithEoa,
        );
        console.log(`Setup of Erc20SwapToConversion successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of Erc20SwapToConversion on ${network}`);
        console.warn(err);
      }
    }),
  );
};
