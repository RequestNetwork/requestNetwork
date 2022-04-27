import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';
import { BigNumber } from 'ethers';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;

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
