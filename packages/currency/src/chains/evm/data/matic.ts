import { CurrencyTypes } from '@requestnetwork/types';
import { supportedMaticERC20 } from '../../../erc20/chains/matic';

export const chainId = 137;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedMaticERC20,
};
