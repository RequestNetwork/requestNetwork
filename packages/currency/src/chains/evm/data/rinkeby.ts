import { TokenMap } from '../../../types';
import { supportedRinkebyERC20 } from '../../../erc20/chains/rinkeby';
import { supportedRinkebyERC777 } from '../../../erc777/chains/rinkeby';

export const chainId = 4;
export const currencies: TokenMap = {
  ...supportedRinkebyERC20,
  ...supportedRinkebyERC777,
};
