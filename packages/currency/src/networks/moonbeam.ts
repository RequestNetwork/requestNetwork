import { TokenMap } from '../types';
import { supportedMoonbeamERC20 } from '../erc20/networks/moonbeam';

export const chainId = 1284;
export const currencies: TokenMap = {
  ...supportedMoonbeamERC20,
};
