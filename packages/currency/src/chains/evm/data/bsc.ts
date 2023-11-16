import { CurrencyTypes } from '@requestnetwork/types';
import { supportedBSCERC20 } from '../../../erc20/chains/bsc';

export const chainId = 56;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedBSCERC20,
};
