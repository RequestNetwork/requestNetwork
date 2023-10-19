import { TokenMap } from '../../../types.js';
import { supportedAvalancheERC20 } from '../../../erc20/chains/avalanche.js';

export const chainId = 43114;
export const currencies: TokenMap = {
  ...supportedAvalancheERC20,
};
