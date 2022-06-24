import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;
// Batch Fees: 1%
export const BATCH_FEE = 10;

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

export const updateBatchPaymentFees = async (
  contract: any,
  nonce: number,
  gasPrice: BigNumber,
): Promise<void> => {
  const currentFees = await contract.batchFee();
  if (currentFees !== BATCH_FEE) {
    await contract.setBatchFee(BATCH_FEE, { nonce: nonce, gasPrice: gasPrice });
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
