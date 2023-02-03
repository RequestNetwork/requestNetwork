import { TokenMap } from '../../types';
import { supportedXDAIERC20 } from '../../erc20/chains/xdai';

export const chainId = 100;
export const currencies: TokenMap = {
  ...supportedXDAIERC20,
};
