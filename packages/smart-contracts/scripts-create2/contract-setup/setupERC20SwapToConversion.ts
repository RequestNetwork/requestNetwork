import { erc20SwapConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasFees,
  updateChainlinkConversionPath,
  updateRequestSwapFees,
  updateSwapRouter,
} from './adminTasks';
import { EVM } from '@requestnetwork/currency';

/**
 * Updates the values of the chainlinkConversionPath and swap router of the ERC20SwapToConversion contract, if needed
 * @param contractAddress address of the ERC20SwapToConversion Proxy
 * @param hre Hardhat runtime environment
 */
export const setupERC20SwapToConversion = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const ERC20SwapToConversionContract = new hre.ethers.Contract(
    contractAddress,
    erc20SwapConversionArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
        EVM.assertChainSupported(network);
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const ERC20SwapToConversionConnected = await ERC20SwapToConversionContract.connect(signer);

        await updateChainlinkConversionPath(ERC20SwapToConversionConnected, network, txOverrides);
        await updateSwapRouter(ERC20SwapToConversionConnected, network, txOverrides);
        await updateRequestSwapFees(ERC20SwapToConversionConnected, txOverrides);
        console.log(`Setup of Erc20SwapToConversion successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of Erc20SwapToConversion on ${network}`);
        console.warn(err);
      }
    }),
  );
};
