import { TokenMap } from '../types';
import { supportedOptimismERC20 } from '../erc20/networks/optimism';

export const chainId = 10;
export const currencies: TokenMap = {
  ...supportedOptimismERC20,
};
