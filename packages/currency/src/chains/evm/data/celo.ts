import { TokenMap } from '../../../types';
import { supportedCeloERC20 } from '../../../erc20/chains/celo';

export const chainId = 42220;
export const currencies: TokenMap = {
  ...supportedCeloERC20,
};
