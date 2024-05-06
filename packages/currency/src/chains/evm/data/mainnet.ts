import { CurrencyTypes } from '@requestnetwork/types';
import { supportedMainnetERC20 } from '../../../erc20/chains/mainnet';

export const chainId = 1;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedMainnetERC20,
};
