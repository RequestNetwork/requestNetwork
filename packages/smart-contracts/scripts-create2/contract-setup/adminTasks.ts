import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import * as artifacts from '../../src/lib';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;
// Batch Fees: .3%
export const BATCH_FEE = 3;

export const updateChainlinkConversionPath = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
  version = undefined,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network, version);
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    const tx = await contract.updateConversionPathAddress(chainlinkConversionPathAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
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
    console.log(`currentFees: ${currentFees.toString()}, new fees: ${REQUEST_SWAP_FEES}`);
    const tx = await contract.updateRequestSwapFees(REQUEST_SWAP_FEES, { gasPrice: gasPrice });
    await tx.wait(1);
  }
};

export const updateBatchPaymentFees = async (contract: any, gasPrice: BigNumber): Promise<void> => {
  const currentFees: BigNumber = await contract.batchFee();
  if (!currentFees.eq(BATCH_FEE)) {
    // Log is useful to have a direct view on what is being updated
    console.log(`currentFees: ${currentFees.toString()}, new fees: ${BATCH_FEE}`);
    const tx = await contract.setBatchFee(BATCH_FEE, { gasPrice: gasPrice });
    await tx.wait(1);
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
    const tx = await contract.setPaymentErc20FeeProxy(erc20FeeProxyAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
  }
};

export const updatePaymentEthFeeProxy = async (
  contract: any,
  network: string,
  gasPrice: BigNumber,
): Promise<void> => {
  const ethereumFeeProxy = artifacts.ethereumFeeProxyArtifact;
  const ethereumFeeProxyAddress = ethereumFeeProxy.getAddress(network);
  const currentAddress = await contract.paymentEthFeeProxy();
  if (currentAddress !== ethereumFeeProxyAddress) {
    const tx = await contract.setPaymentEthFeeProxy(ethereumFeeProxyAddress, {
      gasPrice: gasPrice,
    });
    await tx.wait(1);
  }
};
