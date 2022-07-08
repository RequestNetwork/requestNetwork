import { batchPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { updateChainlinkConversionPath, updatePaymentErc20FeeProxy } from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayments Proxy
 * @param hre Hardhat runtime environment
 */
export const setupEthConversionProxy = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const EthConversionProxyContract = new hre.ethers.Contract(
    contractAddress,
    batchPaymentsArtifact.getContractAbi(),
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
      const EthConversionProxyConnected = await EthConversionProxyContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      // start from the adminNonce, increase gasPrice if needed
      await Promise.all([
        updatePaymentErc20FeeProxy(EthConversionProxyConnected, network, adminNonce, gasPrice),
        updateChainlinkConversionPath(EthConversionProxyConnected, network, adminNonce+1, gasPrice),
      ]);
    }),
  );
  console.log('Setup for EthConversionProxy successful');
};
