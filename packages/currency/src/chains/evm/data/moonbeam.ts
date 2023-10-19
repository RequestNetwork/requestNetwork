import { TokenMap } from '../../../types.js';
import { supportedMoonbeamERC20 } from '../../../erc20/chains/moonbeam.js';

export const chainId = 1284;
export const currencies: TokenMap = {
  ...supportedMoonbeamERC20,
};
