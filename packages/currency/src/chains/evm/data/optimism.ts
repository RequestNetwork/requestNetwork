import { TokenMap } from '../../../types';
import { supportedOptimismERC20 } from '../../../erc20/chains/optimism';

export const chainId = 10;
export const currencies: TokenMap = {
  ...supportedOptimismERC20,
};
