import { TokenMap } from '../../../types.js';
import { supportedOptimismERC20 } from '../../../erc20/chains/optimism.js';

export const chainId = 10;
export const currencies: TokenMap = {
  ...supportedOptimismERC20,
};
