import { CurrencyTypes } from '@requestnetwork/types';
import { supportedCeloERC20 } from '../../../erc20/chains/celo';

export const chainId = 42220;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedCeloERC20,
};
