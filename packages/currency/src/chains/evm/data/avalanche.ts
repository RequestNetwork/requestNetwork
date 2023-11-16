import { CurrencyTypes } from '@requestnetwork/types';
import { supportedAvalancheERC20 } from '../../../erc20/chains/avalanche';

export const chainId = 43114;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedAvalancheERC20,
};
