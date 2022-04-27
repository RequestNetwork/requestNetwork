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
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      let provider;
      if (network === 'celo') {
        provider = utils.getCeloProvider();
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const ERC20SwapToConversionConnected = await ERC20SwapToConversionContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      await Promise.all([
        updateChainlinkConversionPath(
          ERC20SwapToConversionConnected,
          network,
          adminNonce,
          gasPrice,
        ),
        updateSwapRouter(ERC20SwapToConversionConnected, network, adminNonce + 1, gasPrice),
        updateRequestSwapFees(ERC20SwapToConversionConnected, adminNonce + 2, gasPrice),
      ]);
    }),
  );
  console.log('Setup for ERC20SwapToConversion successfull');
};
