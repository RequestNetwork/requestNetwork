import { TokenMap } from '../../../types';
import { supportedMoonbeamERC20 } from '../../../erc20/chains/moonbeam';

export const chainId = 1284;
export const currencies: TokenMap = {
  ...supportedMoonbeamERC20,
};
