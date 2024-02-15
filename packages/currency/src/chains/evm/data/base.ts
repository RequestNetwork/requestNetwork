import { TokenMap } from '../../../types';
import { supportedBaseERC20 } from '../../../erc20/chains/base';

export const chainId = 8453;
export const currencies: TokenMap = {
  ...supportedBaseERC20,
};
