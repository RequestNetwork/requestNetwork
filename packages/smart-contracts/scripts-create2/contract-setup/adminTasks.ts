import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;

// Batch fee: temporarily at 0%
const BATCH_FEE = 0;

// Batch fee amount in USD Limit: 150 * 1e8 ($150)
const BATCH_FEE_AMOUNT_USD_LIMIT = 150 * 1e8;

export const updateChainlinkConversionPath = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, '0.1.0');
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    const tx = await contract.updateConversionPathAddress(chainlinkConversionPathAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
    await tx.wait();
  }
};

export const updateSwapRouter = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
    await contract.setRouter(uniswapV2RouterAddresses[network], {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};

export const updateRequestSwapFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFees = await contract.requestSwapFees();
  if (currentFees !== REQUEST_SWAP_FEES) {
    await contract.updateRequestSwapFees(REQUEST_SWAP_FEES, { nonce: nonce, gasPrice: gasPrice });
  }
};

export const updateBatchPaymentFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees = (await contract.batchFee()) as number;
  if (currentFees - BATCH_FEE !== 0) {
    // Log is useful to have a direct view on was is being updated
    console.log(
      `Batch: the current fees: ${currentFees.toString()}, have been replaced by: ${BATCH_FEE}`,
    );
    const tx = await contract.setBatchFee(BATCH_FEE, { gasPrice: gasPrice });
    await tx.wait();
  }
};

export const updateBatchPaymentFeeAmountUSDLimit = async (
  contract: any,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFeeAmountUSDLimit = (await contract.batchFeeAmountUSDLimit()) as number;
  if (currentFeeAmountUSDLimit - BATCH_FEE_AMOUNT_USD_LIMIT !== 0) {
    // Log is useful to have a direct view on was is being updated
    console.log(
      `Batch: the current fee amount in USD limit: ${currentFeeAmountUSDLimit.toString()}, have been replaced by: ${BATCH_FEE_AMOUNT_USD_LIMIT}. ($1 = 1e8)`,
    );
    const tx = await contract.setBatchFeeAmountUSDLimit(BATCH_FEE_AMOUNT_USD_LIMIT, {
      gasPrice: gasPrice,
    });
    await tx.wait();
  }
};

export const updatePaymentErc20FeeProxy = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
  const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
  const currentAddress = (await contract.paymentErc20FeeProxy()) as string;
  if (currentAddress.toLocaleLowerCase() !== erc20FeeProxyAddress.toLocaleLowerCase()) {
    await contract.setPaymentErc20FeeProxy(erc20FeeProxyAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};

/**
 * Update the address of a proxy used by batch conversion contract
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
  try {
    let proxyAddress: string;
    let batchSetProxy: any;
    let currentAddress: string;
    if (proxyName === 'native') {
      proxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network);
      batchSetProxy = await contract.setPaymentNativeProxy;
      currentAddress = await contract.paymentNativeProxy();
    } else if (proxyName === 'nativeConversion') {
      proxyAddress = artifacts.ethConversionArtifact.getAddress(network);
      batchSetProxy = await contract.setPaymentNativeConversionProxy;
      currentAddress = await contract.paymentNativeConversionProxy();
    } else if (proxyName === 'erc20') {
      proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network);
      batchSetProxy = await contract.setPaymentErc20Proxy;
      currentAddress = await contract.paymentErc20Proxy();
    } else if (proxyName === 'erc20Conversion') {
      proxyAddress = artifacts.erc20ConversionProxy.getAddress(network);
      batchSetProxy = await contract.setPaymentErc20ConversionProxy;
      currentAddress = await contract.paymentErc20ConversionProxy();
    } else {
      // (proxyName === 'chainlinkConversionPath')
      proxyAddress = artifacts.chainlinkConversionPath.getAddress(network);
      batchSetProxy = await contract.setChainlinkConversionPath;
      currentAddress = await contract.chainlinkConversionPath();
    }

    if (currentAddress.toLocaleLowerCase() !== proxyAddress.toLocaleLowerCase()) {
      console.log(
        `${proxyName}: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
      );
      const tx = await batchSetProxy(proxyAddress, {
        gasPrice: gasPrice,
      });
      await tx.wait();
    }
  } catch (e) {
    console.log(`Cannot update ${proxyName} proxy, it might not exist on this network`);
    console.log(e);
  }
};

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
    console.log(
      `Batch: the current NativeAddress: ${currentNativeAddress}, have been replaced by: ${NativeAddress}`,
    );
    console.log(
      `Batch: the current USDAddress: ${currentUSDAddress}, have been replaced by: ${USDAddress}`,
    );
    const tx = await contract.setNativeAndUSDAddress(NativeAddress, USDAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait();
  }
};
