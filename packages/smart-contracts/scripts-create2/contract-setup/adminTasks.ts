import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;
// Batch Fees: .3%
/**
 * BATCH_FEE_DEPRECATED is only used with batchProxy (NOT with batchConversionProxy)
 */
export const BATCH_FEE_DEPRECATED = 3;
export const BATCH_FEE = 30;

// Batch Fees: .3%
export const BATCH_CONVERSION_FEE = 30;

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
 * Updates batch and batchConversion batchFee dependant of the proxy selected
 * @param batchConversionProxy batchConversionProxy must be specified because
 *        it impact the calcul of the batch fees
 */
export const updateBatchPaymentFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
  batchConversionProxy = true,
): Promise<void> => {
  const batchFee = batchConversionProxy ? BATCH_FEE : BATCH_FEE_DEPRECATED;
  const currentFees = await contract.batchFee();
  if (currentFees !== batchFee) {
    // Log is useful to have a direct view on was is being updated
    console.log(`BatchFees, currentFees: ${currentFees.toString()}, new fees: ${batchFee}`);
    await contract.setBatchFee(batchFee, { nonce: nonce, gasPrice: gasPrice });
  }
};

export const updateBatchConversionPaymentFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFees = await contract.batchConversionFee();
  if (currentFees !== BATCH_CONVERSION_FEE) {
    // Log is useful to have a direct view on was is being updated
    console.log(
      `BatchConversionFees, currentFees: ${currentFees.toString()}, new fees: ${BATCH_CONVERSION_FEE}`,
    );
    await contract.setBatchConversionFee(BATCH_CONVERSION_FEE, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
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

export const updatePaymentEthFeeProxy = async (
  contract: any,
  network: string,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const ethereumFeeProxy = artifacts.ethereumFeeProxyArtifact;
  const ethereumFeeProxyAddress = ethereumFeeProxy.getAddress(network);
  const currentAddress = await contract.paymentEthFeeProxy();
  if (currentAddress !== ethereumFeeProxyAddress) {
    await contract.setPaymentEthFeeProxy(ethereumFeeProxyAddress, {
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
    batchSetProxy = contract.setPaymentEthProxy;
    currentAddress = await contract.paymentEthProxy();
  } else if (proxyName === 'ethConversion') {
    proxyAddress = artifacts.ethConversionArtifact.getAddress(network);
    batchSetProxy = contract.setPaymentEthConversionProxy;
    currentAddress = await contract.paymentEthConversionProxy();
  } else if (proxyName === 'erc20') {
    proxyAddress = artifacts.erc20FeeProxyArtifact.getAddress(network);
    batchSetProxy = contract.setPaymentErc20Proxy;
    currentAddress = await contract.paymentErc20Proxy();
  } else {
    // "erc20Conversion"
    proxyAddress = artifacts.erc20ConversionProxy.getAddress(network);
    batchSetProxy = contract.setPaymentErc20ConversionProxy;
    currentAddress = await contract.paymentErc20ConversionProxy();
  }

  if (currentAddress !== proxyAddress) {
    await batchSetProxy(proxyAddress, {
      nonce: nonce,
      gasPrice: gasPrice,
    });
  }
};
