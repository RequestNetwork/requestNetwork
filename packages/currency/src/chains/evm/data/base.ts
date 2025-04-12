import { CurrencyTypes } from '@requestnetwork/types';
import { supportedBaseERC20 } from '../../../erc20/chains/base';

export const chainId = 8453;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedBaseERC20,
};
