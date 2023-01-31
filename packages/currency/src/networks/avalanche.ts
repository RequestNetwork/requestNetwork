import { TokenMap } from '../types';
import { supportedAvalancheERC20 } from '../erc20/networks/avalanche';

export const chainId = 43114;
export const currencies: TokenMap = {
  ...supportedAvalancheERC20,
};
