import { TokenMap } from '../../../types.js';
import { supportedXDAIERC20 } from '../../../erc20/chains/xdai.js';

export const chainId = 100;
export const currencies: TokenMap = {
  ...supportedXDAIERC20,
};
