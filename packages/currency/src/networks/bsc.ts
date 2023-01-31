import { TokenMap } from '../types';
import { supportedBSCERC20 } from '../erc20/networks/bsc';

export const chainId = 56;
export const currencies: TokenMap = {
  ...supportedBSCERC20,
};
