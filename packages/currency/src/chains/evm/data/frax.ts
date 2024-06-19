import { CurrencyTypes } from '@requestnetwork/types';
import { supportedFrax } from 'currency/src/erc20/chains/frax';


export const chainId = 252;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedFrax,
};
