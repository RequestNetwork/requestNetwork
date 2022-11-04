import { ethConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { updateChainlinkConversionPath, updateConversionProxyAddress } from './adminTasks';

/**
 * Updates the values of the ethConversion contract, if needed
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
        const EthConversionProxyConnected = EthConversionProxyContract.connect(signer);
        const gasPrice = await provider.getGasPrice();

        // increase gasPrice if needed
        await updateConversionProxyAddress(
          EthConversionProxyConnected,
          network,
          gasPrice,
          'native',
        );
        await updateChainlinkConversionPath(EthConversionProxyConnected, network, gasPrice);
      }),
    );
  }
  console.log('Setup for EthConversionProxy successful');
};
