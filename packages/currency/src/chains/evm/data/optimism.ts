import { CurrencyTypes } from '@requestnetwork/types';
import { supportedOptimismERC20 } from '../../../erc20/chains/optimism';

export const chainId = 10;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedOptimismERC20,
};
