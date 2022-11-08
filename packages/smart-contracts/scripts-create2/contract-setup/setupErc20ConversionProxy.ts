import { erc20ConversionProxy } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { updateChainlinkConversionPath, updatePaymentErc20FeeProxy } from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayments Proxy
 * @param hre Hardhat runtime environment
 */
export const setupErc20ConversionProxy = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const Erc20ConversionProxyContract = new hre.ethers.Contract(
    contractAddress,
    erc20ConversionProxy.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
        let provider;
        if (network === 'celo') {
          provider = utils.getCeloProvider();
        } else {
          provider = utils.getDefaultProvider(network);
        }
        const signer = new hre.ethers.Wallet(hre.config.xdeploy.signer).connect(provider);
        const Erc20ConversionProxyConnected = await Erc20ConversionProxyContract.connect(signer);
        const gasPrice = await provider.getGasPrice();

        await updatePaymentErc20FeeProxy(Erc20ConversionProxyConnected, network, gasPrice);
        await updateChainlinkConversionPath(Erc20ConversionProxyConnected, network, gasPrice);
        console.log(`Setup of Erc20ConversionProxy successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of Erc20ConversionProxy on ${network}`);
        console.warn(err);
      }
    }),
  );
};
