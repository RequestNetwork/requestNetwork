import { batchPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { updateBatchPaymentFees } from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayment Proxy
 * @param hre Hardhat runtime environment
 */
export const setupBatchPayments = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const batchPaymentContract = new hre.ethers.Contract(
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
      const batchPaymentConnected = batchPaymentContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      await Promise.all([
        updateBatchPaymentFees(batchPaymentConnected, adminNonce + 3, gasPrice.mul(2)),
      ]);
    }),
  );
  console.log('Setup for setupBatchPayment successfull');
};
