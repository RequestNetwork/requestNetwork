import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber, Overrides, Wallet } from 'ethers';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { parseUnits } from 'ethers/lib/utils';
import {
  isEip1559Supported,
  getCeloProvider,
  getDefaultProvider,
  normalizeGasFees,
} from '@requestnetwork/utils';
import { CurrencyTypes } from '@requestnetwork/types';
import { suggestFeesEip1559 } from '../fee-suggestion';

// Swap Fees: set to 5 for 0.5%
const REQUEST_SWAP_FEES = 0;
// Batch Fees: set to 30 for 0.3%
const BATCH_FEE = BigNumber.from(0);

// Batch fee amount in USD Limit: 150 * 1e8 ($150)
const BATCH_FEE_AMOUNT_USD_LIMIT = parseUnits('150', 8);

/**
 * Updates the chainlink address used by the contract.
 * @param contract A contract using chainlink:
 *                 Erc20ConversionProxy | EthConversionProxy | ERC20SwapToConversion.
 * @param network The network used.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param version The version of the chainlink proxy to use, the last one by default.
 */
export const updateChainlinkConversionPath = async (
  contract: any,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  version?: string,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, version);
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    const tx = await contract.updateConversionPathAddress(
      chainlinkConversionPathAddress,
      txOverrides,
    );
    await tx.wait(1);
    console.log(
      `chainlink: the current address ${currentChainlinkAddress} has been replaced by: ${chainlinkConversionPathAddress}`,
    );
  }
};

export const updateSwapRouter = async (
  contract: any,
  network: string,
  txOverrides: Overrides,
): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  const expectedRouter = uniswapV2RouterAddresses[network];
  if (expectedRouter && currentSwapRouter !== expectedRouter) {
    const tx = await contract.setRouter(expectedRouter, txOverrides);
    await tx.wait(1);
    console.log(`Swap router address set to ${expectedRouter}`);
  }
};

export const updateRequestSwapFees = async (
  contract: any,
  txOverrides: Overrides,
): Promise<void> => {
  const currentFees: BigNumber = await contract.requestSwapFees();
  if (!currentFees.eq(REQUEST_SWAP_FEES)) {
    const tx = await contract.updateRequestSwapFees(REQUEST_SWAP_FEES, txOverrides);
    await tx.wait(1);
    console.log(
      `currentFees: ${currentFees.toNumber() / 10}%, new fees: ${REQUEST_SWAP_FEES / 10}%`,
    );
  }
};

/**
 * Updates the batchFee applied by the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 */
export const updateBatchPaymentFees = async (
  contract: any,
  txOverrides: Overrides,
): Promise<void> => {
  const currentFees: BigNumber = await contract.batchFee();
  if (!BATCH_FEE.eq(currentFees)) {
    const tx = await contract.setBatchFee(BATCH_FEE, txOverrides);
    await tx.wait(1);
    console.log(`Batch: currentFees: ${currentFees.toString()}, new fees: ${BATCH_FEE.toString()}`);
  }
};

/**
 * Updates the feeAMountUSDLimit of the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 */
export const updateBatchPaymentFeeAmountUSDLimit = async (
  contract: any,
  txOverrides: Overrides,
): Promise<void> => {
  const currentFeeAmountUSDLimit: BigNumber = await contract.batchFeeAmountUSDLimit();
  if (!currentFeeAmountUSDLimit.eq(BATCH_FEE_AMOUNT_USD_LIMIT)) {
    const tx = await contract.setBatchFeeAmountUSDLimit(BATCH_FEE_AMOUNT_USD_LIMIT, txOverrides);
    await tx.wait(1);
    console.log(
      `Batch: the current fee amount in USD limit: ${currentFeeAmountUSDLimit.toString()}, have been replaced by: ${BATCH_FEE_AMOUNT_USD_LIMIT.toString()}. ($1 = 1e8)`,
    );
  }
};

/**
 * Updates the address of a Native or ERC20 fee proxy stored within a Native or ERC20 fee conversion contract.
 * @param contract A contract using chainlink: EthConversionProxy | Erc20ConversionProxy.
 * @param network The network used.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param proxyType The type of the proxy fee.
 * @param version The version of the fee proxy to use, the last one by default.
 */
export const updatePaymentFeeProxyAddress = async (
  contract: any,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  proxyType: 'native' | 'erc20',
  version?: string,
): Promise<void> => {
  let proxyAddress: string;
  let currentAddress: string;
  if (proxyType === 'native') {
    proxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network, version);
    currentAddress = await contract.paymentProxy();
  } else {
    proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network, version);
    currentAddress = await contract.paymentProxy();
  }

  if (currentAddress.toLocaleLowerCase() !== proxyAddress.toLocaleLowerCase()) {
    const tx = await contract.updateConversionProxyAddress(proxyAddress, txOverrides);
    await tx.wait();
    console.log(
      `${proxyType} conversion proxy: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
    );
  }
};

/**
 * Update the address of a proxy used by batch conversion contract.
 * @param contract BatchConversionPayments contract.
 * @param network The network used.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 * @param proxyName The name of the fee proxy to update.
 */
export const updateBatchConversionProxy = async (
  contract: any,
  network: CurrencyTypes.EvmChainName,
  txOverrides: Overrides,
  proxyName:
    | 'native'
    | 'nativeConversion'
    | 'erc20'
    | 'erc20Conversion'
    | 'chainlinkConversionPath',
): Promise<void> => {
  let proxyAddress: string;
  let batchSetProxy: any;
  let currentAddress: string;
  switch (proxyName) {
    case 'native':
      proxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network);
      batchSetProxy = await contract.setPaymentNativeProxy;
      currentAddress = await contract.paymentNativeProxy();
      break;
    case 'nativeConversion':
      proxyAddress = artifacts.ethConversionArtifact.getAddress(network);
      batchSetProxy = await contract.setPaymentNativeConversionProxy;
      currentAddress = await contract.paymentNativeConversionProxy();
      break;
    case 'erc20':
      proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network);
      batchSetProxy = await contract.setPaymentErc20Proxy;
      currentAddress = await contract.paymentErc20Proxy();
      break;
    case 'erc20Conversion':
      proxyAddress = artifacts.erc20ConversionProxy.getAddress(network);
      batchSetProxy = await contract.setPaymentErc20ConversionProxy;
      currentAddress = await contract.paymentErc20ConversionProxy();
      break;
    case 'chainlinkConversionPath':
      proxyAddress = artifacts.chainlinkConversionPath.getAddress(network);
      batchSetProxy = await contract.setChainlinkConversionPath;
      currentAddress = await contract.chainlinkConversionPath();
      break;
  }

  if (currentAddress.toLocaleLowerCase() !== proxyAddress.toLocaleLowerCase()) {
    const tx = await batchSetProxy(proxyAddress, txOverrides);
    await tx.wait(1);
    console.log(
      `${proxyName}: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
    );
  }
};

/**
 * Update the native and the USD addresses used by batch conversion contract.
 * @param contract BatchConversionPayments contract.
 * @param NativeAddress The address of native token, eg: ETH.
 * @param USDAddress The address of USD token.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 */
export const updateNativeAndUSDAddress = async (
  contract: any,
  NativeAddress: string,
  USDAddress: string,
  txOverrides: Overrides,
): Promise<void> => {
  const currentUSDAddress = (await contract.USDAddress()).toLocaleLowerCase();
  const currentNativeAddress = (await contract.NativeAddress()).toLocaleLowerCase();
  if (
    currentNativeAddress !== NativeAddress.toLocaleLowerCase() ||
    currentUSDAddress !== USDAddress.toLocaleLowerCase()
  ) {
    const tx = await contract.setNativeAndUSDAddress(NativeAddress, USDAddress, txOverrides);
    await tx.wait(1);
    console.log(
      `Batch: the current NativeAddress: ${currentNativeAddress}, have been replaced by: ${NativeAddress}`,
    );
    console.log(
      `Batch: the current USDAddress: ${currentUSDAddress}, have been replaced by: ${USDAddress}`,
    );
  }
};

/**
 * Update the native token hash used by a contract.
 * @param contract contract to be updated.
 * @param nativeTokenHash The address of native token, eg: ETH.
 * @param txOverrides information related to gas fees. Increase their values if needed.
 */
export const updateNativeTokenHash = async (
  contractType: string,
  contract: any,
  nativeTokenHash: string,
  txOverrides: Overrides,
): Promise<void> => {
  const currentNativeTokenHash = (await contract.nativeTokenHash()).toLocaleLowerCase();
  if (currentNativeTokenHash !== nativeTokenHash.toLocaleLowerCase()) {
    const tx = await contract.updateNativeTokenHash(nativeTokenHash, txOverrides);
    await tx.wait(1);
    console.log(
      `${contractType}: the current NativeTokenHash: ${currentNativeTokenHash}, have been replaced by: ${nativeTokenHash}`,
    );
  }
};

/**
 * Gets the signer and gas fees information.
 * @param network The network used.
 * @param hre Hardhat runtime environment.
 * @returns An object:
 * - The signer
 * - txOverrides, with gas fee information
 */
export const getSignerAndGasFees = async (
  network: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<{
  signer: Wallet;
  txOverrides: {
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  };
}> => {
  let provider;
  if (network === 'celo') {
    provider = getCeloProvider();
  } else {
    provider = getDefaultProvider(network);
  }
  const signer = new hre.ethers.Wallet(hre.config.xdeploy.signer).connect(provider);

  const txOverrides = (await isEip1559Supported(provider))
    ? await normalizeGasFees({
        logger: console,
        suggestFees: suggestFeesEip1559(provider),
      })
    : {};

  return {
    signer,
    txOverrides,
  };
};
