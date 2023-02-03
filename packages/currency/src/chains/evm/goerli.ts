import { TokenMap } from '../../types';
import { supportedGoerliERC20 } from '../../erc20/chains/goerli';

export const chainId = 5;
export const currencies: TokenMap = {
  ...supportedGoerliERC20,
};
