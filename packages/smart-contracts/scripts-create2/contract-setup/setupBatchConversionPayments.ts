import { batchConversionPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import {
  updateBatchPaymentFees,
  updateBatchConversionPaymentFees,
  updateBatchConversionPaymentProxy,
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
      let provider;
      if (network === 'celo') {
        provider = utils.getCeloProvider();
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const batchConversionPaymentConnected = await batchConversionPaymentContract.connect(signer);
      const adminNonce = await signer.getTransactionCount();
      const gasPrice = await provider.getGasPrice();

      // start from the adminNonce, increase gasPrice if needed
      const gasCoef = 3;
      await Promise.all([
        updateBatchPaymentFees(batchConversionPaymentConnected, adminNonce, gasPrice.mul(gasCoef)),
        updateBatchConversionPaymentFees(
          batchConversionPaymentConnected,
          adminNonce + 1,
          gasPrice.mul(gasCoef),
        ),
        updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          adminNonce + 2,
          gasPrice.mul(gasCoef),
          'erc20',
        ),
        updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          adminNonce + 3,
          gasPrice.mul(gasCoef),
          'eth',
        ),
        updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          adminNonce + 4,
          gasPrice.mul(gasCoef),
          'erc20Conversion',
        ),
        updateBatchConversionPaymentProxy(
          batchConversionPaymentConnected,
          network,
          adminNonce + 5,
          gasPrice.mul(gasCoef),
          'ethConversion',
        ),
      ]);
    }),
  );
  console.log('Setup for setupBatchConversionPayment successfull');
};
