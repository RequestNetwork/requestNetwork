import { TokenMap } from '../../../types.js';
import { supportedMaticERC20 } from '../../../erc20/chains/matic.js';

export const chainId = 137;
export const currencies: TokenMap = {
  ...supportedMaticERC20,
};
