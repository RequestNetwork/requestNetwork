import { TokenMap } from '../../../types.js';
import { supportedBSCERC20 } from '../../../erc20/chains/bsc.js';

export const chainId = 56;
export const currencies: TokenMap = {
  ...supportedBSCERC20,
};
