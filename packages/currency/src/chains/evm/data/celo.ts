import { TokenMap } from '../../../types.js';
import { supportedCeloERC20 } from '../../../erc20/chains/celo.js';

export const chainId = 42220;
export const currencies: TokenMap = {
  ...supportedCeloERC20,
};
