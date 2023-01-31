import { TokenMap } from '../types';
import { supportedRinkebyERC20 } from '../erc20/networks/rinkeby';
import { supportedRinkebyERC777 } from '../erc777/networks/rinkeby';

export const chainId = 4;
export const currencies: TokenMap = {
  ...supportedRinkebyERC20,
  ...supportedRinkebyERC777,
};
