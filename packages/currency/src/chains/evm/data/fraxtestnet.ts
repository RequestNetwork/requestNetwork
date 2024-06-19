import { CurrencyTypes } from '@requestnetwork/types';
import { supportedFraxtestneterc20 } from 'currency/src/erc20/chains/fraxtestnet';

export const chainId = 2522;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedFraxtestneterc20,
};
