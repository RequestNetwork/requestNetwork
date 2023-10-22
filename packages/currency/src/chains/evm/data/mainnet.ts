import { TokenMap } from '../../../types.js';
import { supportedMainnetERC20 } from '../../../erc20/chains/mainnet.js';

export const chainId = 1;
export const currencies: TokenMap = {
  ...supportedMainnetERC20,
};
