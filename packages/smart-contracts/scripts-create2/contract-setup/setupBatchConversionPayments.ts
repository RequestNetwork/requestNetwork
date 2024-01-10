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
 * @param safeMode Are transactions to be executed in Safe context
 */
export const setupBatchConversionPayments = async ({
  contractAddress,
  hre,
  safeMode,
}: {
  contractAddress?: string;
  hre: HardhatRuntimeEnvironmentExtended;
  safeMode: boolean;
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
    await updateBatchPaymentFees(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      signer,
      safeMode,
    );
    await updateBatchPaymentFeeAmountUSDLimit(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      signer,
      safeMode,
    );
    const proxies = [
      'erc20',
      'native',
      'erc20Conversion',
      'nativeConversion',
      'chainlinkConversionPath',
    ];
    for (const proxy of proxies) {
      await updateBatchConversionProxy(
        batchConversionPaymentConnected,
        network,
        txOverrides,
        proxy,
        signer,
        safeMode,
      );
    }
    await updateNativeAndUSDAddress(
      batchConversionPaymentConnected,
      network,
      NativeAddress,
      USDAddress,
      txOverrides,
      signer,
      safeMode,
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
