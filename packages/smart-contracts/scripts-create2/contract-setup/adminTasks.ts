import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;

// Batch conversion and no conversion fees: .3%
const BATCH_NO_CONVERSION_FEE = 30;
const BATCH_CONVERSION_FEE = 30;

export const updateChainlinkConversionPath = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, '0.1.0');
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    await contract.updateConversionPathAddress(chainlinkConversionPathAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
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

/**
 * Updates batch fees with/out conversion
 * BATCH_NO_CONVERSION_FEE e.g: payment DAI - DAI
 * BATCH_CONVERSION_FEE e.g: payment EUR - DAI
 */
export const updateBatchPaymentFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
  feesName: 'BatchNoConversionFee' | 'BatchConversionFee',
): Promise<void> => {
  const feesApplied =
    feesName === 'BatchNoConversionFee' ? BATCH_NO_CONVERSION_FEE : BATCH_CONVERSION_FEE;
  const currentFees = await contract.batchFee();
  if (currentFees !== feesApplied) {
    // Log is useful to have a direct view on was is being updated
    console.log(
      `${feesName}: the current fees: ${currentFees.toString()}, have been replaced by: ${feesApplied}`,
    );
    await contract.setBatchFee(feesApplied, { nonce: nonce, gasPrice: gasPrice });
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
  const currentAddress = await contract.paymentErc20FeeProxy();
  if (currentAddress !== erc20FeeProxyAddress) {
    await contract.setPaymentErc20FeeProxy(erc20FeeProxyAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};

/**
 * Update the address of a payment proxy used by batch conversion contract
 */
export const updateBatchConversionPaymentProxy = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
  proxyName: 'eth' | 'ethConversion' | 'erc20' | 'erc20Conversion',
): Promise<void> => {
  let proxyAddress: string;
  let batchSetProxy: any;
  let currentAddress: string;
  if (proxyName === 'eth') {
    proxyAddress = artifacts.ethereumFeeProxyArtifact.getAddress(network);
    batchSetProxy = await contract.setPaymentEthProxy;
    currentAddress = await contract.paymentEthProxy();
  } else if (proxyName === 'ethConversion') {
    proxyAddress = artifacts.ethConversionArtifact.getAddress(network);
    batchSetProxy = await contract.setPaymentEthConversionProxy;
    currentAddress = await contract.paymentEthConversionProxy();
  } else if (proxyName === 'erc20') {
    proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network);
    batchSetProxy = await contract.setPaymentErc20Proxy;
    currentAddress = await contract.paymentErc20Proxy();
  } else {
    // proxyName === "erc20Conversion"
    proxyAddress = artifacts.erc20ConversionProxy.getAddress(network);
    batchSetProxy = await contract.setPaymentErc20ConversionProxy;
    currentAddress = await contract.paymentErc20ConversionProxy();
  }

  if (currentAddress !== proxyAddress) {
    console.log(
      `${proxyName}: the current address ${currentAddress} has been replaced by: ${proxyAddress}`,
    );
    await batchSetProxy(proxyAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};
