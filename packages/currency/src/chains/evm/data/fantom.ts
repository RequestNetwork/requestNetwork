import { TokenMap } from '../../../types.js';
import { supportedFantomERC20 } from '../../../erc20/chains/fantom.js';

export const chainId = 250;
export const currencies: TokenMap = {
  ...supportedFantomERC20,
};
