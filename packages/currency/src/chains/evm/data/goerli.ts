import { CurrencyTypes } from '@requestnetwork/types';
import { supportedGoerliERC20 } from '../../../erc20/chains/goerli';

export const chainId = 5;
export const testnet = true;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedGoerliERC20,
};
