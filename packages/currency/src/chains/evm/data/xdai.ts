import { CurrencyTypes } from '@requestnetwork/types';
import { supportedXDAIERC20 } from '../../../erc20/chains/xdai';

export const chainId = 100;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedXDAIERC20,
};
