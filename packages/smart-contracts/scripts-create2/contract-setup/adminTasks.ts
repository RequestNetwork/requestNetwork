import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;

// Batch conversion and no conversion fees: temporarily at 0%
const BATCH_NO_CONVERSION_FEE = 0;
const BATCH_CONVERSION_FEE = 0;

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

export const updateBatchPaymentFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees = await contract.batchFee();
  if (currentFees.toNumber() !== BATCH_NO_CONVERSION_FEE) {
    // Log is useful to have a direct view on was is being updated
    console.log(
      `Batch: the current fees: ${currentFees.toString()}, have been replaced by: ${BATCH_NO_CONVERSION_FEE}`,
    );
    await contract.setBatchFee(BATCH_NO_CONVERSION_FEE, { gasPrice: gasPrice });
  }
};

export const updateBatchConversionPaymentFees = async (
  contract: any,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFees = await contract.batchConversionFee();
  if (currentFees.toNumber() !== BATCH_CONVERSION_FEE) {
    // Log is useful to have a direct view on was is being updated
    console.log(
      `$Batch conversion: the current fees: ${currentFees.toString()}, have been replaced by: ${BATCH_CONVERSION_FEE}`,
    );
    await contract.setBatchConversionFee(BATCH_CONVERSION_FEE, {
      gasPrice: gasPrice,
    });
  }
};

export const updatePaymentErc20FeeProxy = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const erc20FeeProxy = artifacts.erc20FeeProxyArtifact;
  const erc20FeeProxyAddress = erc20FeeProxy.getAddress(network);
  const currentAddress = await contract.paymentErc20FeeProxy();
  if (currentAddress !== erc20FeeProxyAddress) {
    await contract.setPaymentErc20FeeProxy(erc20FeeProxyAddress, {
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
  gasPrice: BigNumber,
  proxyName: 'eth' | 'ethConversion' | 'erc20' | 'erc20Conversion',
): Promise<void> => {
  try {
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
        gasPrice: gasPrice,
      });
    }
  } catch (e) {
    console.log(`Cannot update ${proxyName} proxy, it might not exist on this network`);
    console.log(e);
  }
};
