import { erc20SwapConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import {
  updateChainlinkConversionPath,
  updateRequestSwapFees,
  updateSwapRouter,
} from './adminTasks';

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
  for (const network of hre.config.xdeploy.networks) {
    await Promise.all(
      [network].map(async (network) => {
        let provider;
        if (network === 'celo') {
          provider = utils.getCeloProvider();
        } else {
          provider = utils.getDefaultProvider(network);
        }
        const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
        const signer = wallet.connect(provider);
        const ERC20SwapToConversionConnected = ERC20SwapToConversionContract.connect(signer);
        const gasPrice = await provider.getGasPrice();

        await updateChainlinkConversionPath(ERC20SwapToConversionConnected, network, gasPrice);
        await updateSwapRouter(ERC20SwapToConversionConnected, network, gasPrice);
        await updateRequestSwapFees(ERC20SwapToConversionConnected, gasPrice);
      }),
    );
  }
  console.log('Setup for ERC20SwapToConversion successfull');
};
