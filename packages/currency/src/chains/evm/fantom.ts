import { TokenMap } from '../../types';
import { supportedFantomERC20 } from '../../erc20/chains/fantom';

export const chainId = 250;
export const currencies: TokenMap = {
  ...supportedFantomERC20,
};
