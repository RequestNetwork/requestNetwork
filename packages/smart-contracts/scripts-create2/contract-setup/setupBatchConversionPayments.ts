import { batchConversionPaymentsArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import {
  updateBatchPaymentFees,
  updateBatchConversionProxy,
  updateBatchPaymentFeeAmountUSDLimit,
  updateNativeAndUSDAddress,
} from './adminTasks';
import { CurrencyManager } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
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
  // constants related to chainlink and conversion rate
  const currencyManager = CurrencyManager.getDefault();

  const setUpActions = async (network: string) => {
    const NativeAddress = currencyManager.getNativeCurrency(
      RequestLogicTypes.CURRENCY.ETH,
      network,
    )!.hash;
    const USDAddress = currencyManager.fromSymbol('USD')!.hash;
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
    const gasCoef = 3;
    await updateBatchPaymentFees(batchConversionPaymentConnected, gasPrice.mul(gasCoef));
    await updateBatchPaymentFeeAmountUSDLimit(
      batchConversionPaymentConnected,
      gasPrice.mul(gasCoef),
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      gasPrice.mul(gasCoef),
      'erc20',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      gasPrice.mul(gasCoef),
      'native',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      gasPrice.mul(gasCoef),
      'erc20Conversion',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      gasPrice.mul(gasCoef),
      'nativeConversion',
    );
    await updateBatchConversionProxy(
      batchConversionPaymentConnected,
      network,
      gasPrice.mul(gasCoef),
      'chainlinkConversionPath',
    );
    await updateNativeAndUSDAddress(
      batchConversionPaymentConnected,
      NativeAddress,
      USDAddress,
      gasPrice.mul(gasCoef),
    );
  };
  for (const network of hre.config.xdeploy.networks) {
    await Promise.resolve(setUpActions(network));
  }
  console.log('Setup for setupBatchConversionPayment successfull');
};
