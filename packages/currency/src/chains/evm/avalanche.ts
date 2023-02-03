import { TokenMap } from '../../types';
import { supportedAvalancheERC20 } from '../../erc20/chains/avalanche';

export const chainId = 43114;
export const currencies: TokenMap = {
  ...supportedAvalancheERC20,
};
