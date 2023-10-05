import { batchConversionPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasFees,
  updateBatchConversionProxy,
  updateBatchPaymentFeeAmountUSDLimit,
  updateBatchPaymentFees,
  updateNativeAndUSDAddress,
} from './adminTasks';
import { CurrencyManager, EvmChains } from '@requestnetwork/currency';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

/**
 * Updates the values of the batch fees of the BatchConversionPayments contract, if needed.
 * @param contractAddress address of the BatchConversionPayments contract.
 *                        If not provided fallback to the latest deployment address
 * @param hre Hardhat runtime environment.
 */
export const setupBatchConversionPayments = async ({
  contractAddress,
  hre,
}: {
  contractAddress?: string;
  hre: HardhatRuntimeEnvironmentExtended;
}): Promise<void> => {
  // Setup contract parameters

  // constants related to chainlink and conversion rate
  const currencyManager = CurrencyManager.getDefault();

  const setUpActions = async (network: CurrencyTypes.EvmChainName) => {
    console.log(`Setup BatchConversionPayments on ${network}`);

    if (!contractAddress) {
      contractAddress = batchConversionPaymentsArtifact.getAddress(network);
    }
    const batchConversionPaymentContract = new hre.ethers.Contract(
      contractAddress,
      batchConversionPaymentsArtifact.getContractAbi(),
    );

    const NativeAddress = currencyManager.getNativeCurrency(
      RequestLogicTypes.CURRENCY.ETH,
      network,
    )!.hash;
    const USDAddress = currencyManager.fromSymbol('USD')!.hash;

    const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
    const batchConversionPaymentConnected = batchConversionPaymentContract.connect(signer);
    await updateBatchPaymentFees(batchConversionPaymentConnected, txOverrides);
    await updateBatchPaymentFeeAmountUSDLimit(batchConversionPaymentConnected, txOverrides);
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      'erc20',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      'native',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      'erc20Conversion',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      'nativeConversion',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      'chainlinkConversionPath',
    );
    await updateNativeAndUSDAddress(
      batchConversionPaymentConnected,
      NativeAddress,
      USDAddress,
      txOverrides,
    );
  };
  for (const network of hre.config.xdeploy.networks) {
    try {
      EvmChains.assertChainSupported(network);
      await setUpActions(network);
    } catch (err) {
      console.warn(`An error occurred during the setup of BatchConversion on ${network}`);
      console.warn(err);
    }
  }
  console.log('Setup for setupBatchConversionPayment successful');
};
