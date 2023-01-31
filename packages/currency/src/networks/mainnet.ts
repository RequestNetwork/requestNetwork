import { TokenMap } from '../types';
import { supportedMainnetERC20 } from '../erc20/networks/mainnet';

export const chainId = 1;
export const currencies: TokenMap = {
  ...supportedMainnetERC20,
};
