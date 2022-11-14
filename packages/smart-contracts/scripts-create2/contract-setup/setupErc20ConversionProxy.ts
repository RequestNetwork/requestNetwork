import { erc20ConversionProxy } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasPrice,
  updateChainlinkConversionPath,
  updatePaymentErc20FeeProxy,
} from './adminTasks';

/**
 * Updates the values of the chainlinkConversionPath and ERC20FeeProxy addresses if needed
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
        const { signer, gasPrice } = await getSignerAndGasPrice(network, hre);
        const Erc20ConversionProxyConnected = await Erc20ConversionProxyContract.connect(signer);

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
