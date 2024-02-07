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
 * @param signWithEoa Are transactions to be signed by an EAO
 */
export const setupBatchConversionPayments = async ({
  contractAddress,
  hre,
  signWithEoa,
}: {
  contractAddress?: string;
  hre: HardhatRuntimeEnvironmentExtended;
  signWithEoa: boolean;
}): Promise<void> => {
  // Setup contract parameters

  // constants related to chainlink and conversion rate
  const currencyManager = CurrencyManager.getDefault();

  const setUpActions = async (network: ChainTypes.IEvmChain) => {
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
      signWithEoa,
    );
    await updateBatchPaymentFeeAmountUSDLimit(
      batchConversionPaymentConnected,
      network,
      txOverrides,
      signer,
      signWithEoa,
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
        signWithEoa,
      );
    }
    await updateNativeAndUSDAddress(
      batchConversionPaymentConnected,
      network,
      NativeAddress,
      USDAddress,
      txOverrides,
      signer,
      signWithEoa,
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
