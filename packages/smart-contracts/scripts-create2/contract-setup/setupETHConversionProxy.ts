import { ethConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { updateChainlinkConversionPath, updatePaymentEthFeeProxy } from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayments Proxy
 * @param hre Hardhat runtime environment
 */
export const setupETHConversionProxy = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const EthConversionProxyContract = new hre.ethers.Contract(
    contractAddress,
    ethConversionArtifact.getContractAbi(),
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
        const EthConversionProxyConnected = await EthConversionProxyContract.connect(signer);
        const gasPrice = await provider.getGasPrice();

        await updatePaymentEthFeeProxy(EthConversionProxyConnected, network, gasPrice);
        await updateChainlinkConversionPath(EthConversionProxyConnected, network, gasPrice);
        console.log(`Setup of EthConversionProxy successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of EthConversionProxy on ${network}`);
        console.warn(err);
      }
    }),
  );
};
