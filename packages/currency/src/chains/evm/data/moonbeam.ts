import { CurrencyTypes } from '@requestnetwork/types';
import { supportedMoonbeamERC20 } from '../../../erc20/chains/moonbeam';

export const chainId = 1284;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedMoonbeamERC20,
};
