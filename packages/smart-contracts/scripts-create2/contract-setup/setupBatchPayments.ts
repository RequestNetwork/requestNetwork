import { batchPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasPrice,
  updateBatchPaymentFees,
  updatePaymentErc20FeeProxy,
  updatePaymentEthFeeProxy,
} from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchPayments contract, if needed
 * @param contractAddress address of the BatchPayments Proxy
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
      try {
        const { signer, gasPrice } = await getSignerAndGasPrice(network, hre);
        const batchPaymentConnected = await batchPaymentContract.connect(signer);

        await updateBatchPaymentFees(batchPaymentConnected, gasPrice.mul(2));
        await updatePaymentErc20FeeProxy(batchPaymentConnected, network, gasPrice.mul(2));
        await updatePaymentEthFeeProxy(batchPaymentConnected, network, gasPrice.mul(2));
        console.log(`Setup of BatchPayment successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of BatchPayment on ${network}`);
        console.warn(err);
      }
    }),
  );
  console.log('Setup for setupBatchPayment successfull');
};
