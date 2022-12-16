import { erc20ConversionProxy } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasFees,
  updateChainlinkConversionPath,
  updatePaymentFeeProxyAddress,
} from './adminTasks';

const ERC20ConversionVersion = '0.1.2';

/**
 * Updates the values of the chainlinkConversionPath and ERC20FeeProxy addresses if needed
 * @param contractAddress address of the ERC20Conversion Proxy
 * @param hre Hardhat runtime environment
 */
export const setupErc20ConversionProxy = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const Erc20ConversionProxyContract = new hre.ethers.Contract(
    contractAddress,
    erc20ConversionProxy.getContractAbi(ERC20ConversionVersion),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const Erc20ConversionProxyConnected = Erc20ConversionProxyContract.connect(signer);
        await updatePaymentFeeProxyAddress(
          Erc20ConversionProxyConnected,
          network,
          txOverrides,
          'erc20',
        );
        await updateChainlinkConversionPath(Erc20ConversionProxyConnected, network, txOverrides);
        console.log(`Setup of Erc20ConversionProxy successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of Erc20ConversionProxy on ${network}`);
        console.warn(err);
      }
    }),
  );
};
