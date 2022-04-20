import { chainlinkConversionPath } from '../../src/lib';
import { uniswapV2RouterAddresses } from '../../scripts/utils';

// Fees: 0.5%
export const REQUEST_SWAP_FEES = 5;

export const updateChainlinkConversionPath = async (
  contract: any,
  network: string,
): Promise<void> => {
  const currentChainlinkAddress = await contract.chainlinkConversionPath();
  const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network);
  if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
    await contract.updateConversionPathAddress(chainlinkConversionPathAddress);
  }
};

export const updateSwapRouter = async (contract: any, network: string): Promise<void> => {
  const currentSwapRouter = await contract.swapRouter();
  if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
    await contract.setRouter(uniswapV2RouterAddresses[network]);
  }
};

export const updateRequestSwapFees = async (contract: any): Promise<void> => {
  const currentFees = await contract.requestSwapFees();
  if (currentFees !== REQUEST_SWAP_FEES) {
    await contract.updateRequestSwapFees(REQUEST_SWAP_FEES);
  }
};
