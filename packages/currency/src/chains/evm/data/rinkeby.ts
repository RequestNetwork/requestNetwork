import { TokenMap } from '../../../types.js';
import { supportedRinkebyERC20 } from '../../../erc20/chains/rinkeby.js';
import { supportedRinkebyERC777 } from '../../../erc777/chains/rinkeby.js';

export const chainId = 4;
export const testnet = true;
export const currencies: TokenMap = {
  ...supportedRinkebyERC20,
  ...supportedRinkebyERC777,
};
