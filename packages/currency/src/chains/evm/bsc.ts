import { TokenMap } from '../../types';
import { supportedBSCERC20 } from '../../erc20/chains/bsc';

export const chainId = 56;
export const currencies: TokenMap = {
  ...supportedBSCERC20,
};
