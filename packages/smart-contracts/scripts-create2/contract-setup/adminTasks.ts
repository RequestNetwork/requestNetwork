import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber, Wallet } from 'ethers';
import utils from '@requestnetwork/utils';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { parseUnits } from 'ethers/lib/utils';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;
// Batch Fees: .3%
export const BATCH_FEE = BigNumber.from(30);
// Batch fee amount in USD Limit: 150 * 1e8 ($150)
const BATCH_FEE_AMOUNT_USD_LIMIT = parseUnits('150', 8);

/**
 * Updates the chainlink address used by the contract.
 * @param contract A contract using chainlink:
 *                 Erc20ConversionProxy | EthConversionProxy | ERC20SwapToConversion.
 * @param network The network used.
 * @param gasPrice The gas price used. Increase its value if needed.
 * @param version The version of the chainlink proxy to use, the last one by default.
 */
export const updateChainlinkConversionPath = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
  version?: string,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, version);
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    const tx = await contract.updateConversionPathAddress(chainlinkConversionPathAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
    console.log(
      `chainlink: the current address ${currentChainlinkAddress} has been replaced by: ${chainlinkConversionPathAddress}`,
    );
  }
};

export const updateSwapRouter = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
    const tx = await contract.setRouter(uniswapV2RouterAddresses[network], {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
  }
};

export const updateRequestSwapFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees: BigNumber = await contract.requestSwapFees();
  if (!currentFees.eq(REQUEST_SWAP_FEES)) {
    const tx = await contract.updateRequestSwapFees(REQUEST_SWAP_FEES, { gasPrice: gasPrice });
    await tx.wait(1);
    console.log(`currentFees: ${currentFees.toString()}, new fees: ${REQUEST_SWAP_FEES}`);
  }
};

/**
 * Updates the batchFee applied by the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param gasPrice The gas price used. Increase its value if needed.
 */
export const updateBatchPaymentFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees: BigNumber = await contract.batchFee();
  if (!BATCH_FEE.eq(currentFees)) {
    const tx = await contract.setBatchFee(BATCH_FEE, { gasPrice: gasPrice });
    await tx.wait(1);
    console.log(`Batch: currentFees: ${currentFees.toString()}, new fees: ${BATCH_FEE.toString()}`);
  }
};

/**
 * Updates the feeAMountUSDLimit of the batch conversion proxy.
 * @param contract BatchConversionPayments contract.
 * @param gasPrice The gas price used. Increase its value if needed.
 */
export const updateBatchPaymentFeeAmountUSDLimit = async (
  contract: any,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFeeAmountUSDLimit: BigNumber = await contract.batchFeeAmountUSDLimit();
  if (!currentFeeAmountUSDLimit.eq(BATCH_FEE_AMOUNT_USD_LIMIT)) {
    const tx = await contract.setBatchFeeAmountUSDLimit(BATCH_FEE_AMOUNT_USD_LIMIT, {
      gasPrice: gasPrice,
    });
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
 * @param gasPrice The gas price used. Increase its value if needed.
 * @param proxyType The type of the proxy fee.
 * @param version The version of the fee proxy to use, the last one by default.
 */
export const updatePaymentFeeProxyAddress = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
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
    const tx = await contract.updateConversionProxyAddress(proxyAddress, {
      gasPrice: gasPrice,
    });
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
 * @param gasPrice The gas price used. Increase its value if needed.
 * @param proxyName The name of the fee proxy to update.
 */
export const updateBatchConversionProxy = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
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
    const tx = await batchSetProxy(proxyAddress, {
      gasPrice: gasPrice,
    });
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
 * @param gasPrice The gas price used. Increase its value if needed.
 */
export const updateNativeAndUSDAddress = async (
  contract: any,
  NativeAddress: string,
  USDAddress: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentUSDAddress = (await contract.USDAddress()).toLocaleLowerCase();
  const currentNativeAddress = (await contract.NativeAddress()).toLocaleLowerCase();
  if (
    currentNativeAddress !== NativeAddress.toLocaleLowerCase() ||
    currentUSDAddress !== USDAddress.toLocaleLowerCase()
  ) {
    const tx = await contract.setNativeAndUSDAddress(NativeAddress, USDAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
    console.log(
      `Batch: the current NativeAddress: ${currentNativeAddress}, have been replaced by: ${NativeAddress}`,
    );
    console.log(
      `Batch: the current USDAddress: ${currentUSDAddress}, have been replaced by: ${USDAddress}`,
    );
  }
};

export const getSignerAndGasPrice = async (
  network: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<{ signer: Wallet; gasPrice: BigNumber }> => {
  let provider;
  if (network === 'celo') {
    provider = utils.getCeloProvider();
  } else {
    provider = utils.getDefaultProvider(network);
  }
  const signer = new hre.ethers.Wallet(hre.config.xdeploy.signer).connect(provider);
  const gasPrice = await provider.getGasPrice();

  return {
    signer,
    gasPrice,
  };
};
