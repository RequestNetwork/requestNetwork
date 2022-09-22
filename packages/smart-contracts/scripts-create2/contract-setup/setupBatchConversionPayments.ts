import { batchConversionPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import {
  updateBatchPaymentFees,
  updateBatchConversionPaymentProxy,
  updateBatchConversionPaymentFees,
} from './adminTasks';

/**
 * Updates the values of the batch fees of the BatchConversionPayments contract, if needed
 * @param contractAddress address of the BatchConversionPayments Proxy
 * @param hre Hardhat runtime environment
 */
export const setupBatchConversionPayments = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const batchConversionPaymentContract = new hre.ethers.Contract(
    contractAddress,
    batchConversionPaymentsArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      console.log(`Setup BatchConversionPayments on ${network}`);
      let provider;
      if (network === 'celo') {
        provider = utils.getCeloProvider();
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const batchConversionPaymentConnected = batchConversionPaymentContract.connect(signer);
      const gasPrice = await provider.getGasPrice();

      // start from the adminNonce, increase gasPrice if needed
      const gasCoef = 2;
      await updateBatchPaymentFees(batchConversionPaymentConnected, gasPrice.mul(gasCoef)),
        await updateBatchConversionPaymentFees(
          batchConversionPaymentConnected,
          gasPrice.mul(gasCoef),
        ),
        await updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          gasPrice.mul(gasCoef),
          'erc20',
        ),
        await updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          gasPrice.mul(gasCoef),
          'eth',
        ),
        await updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          gasPrice.mul(gasCoef),
          'erc20Conversion',
        ),
        await updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          gasPrice.mul(gasCoef),
          'ethConversion',
        );
    }),
  );
  console.log('Setup for setupBatchConversionPayment successfull');
};
