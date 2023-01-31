import { TokenMap } from '../types';
import { supportedFantomTokens } from '../erc20/networks/fantom';

export const chainId = 250;
export const currencies: TokenMap = {
  ...supportedFantomTokens,
};
