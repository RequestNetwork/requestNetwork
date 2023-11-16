import { CurrencyTypes } from '@requestnetwork/types';
import { supportedRinkebyERC20 } from '../../../erc20/chains/rinkeby';
import { supportedRinkebyERC777 } from '../../../erc777/chains/rinkeby';

export const chainId = 4;
export const testnet = true;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedRinkebyERC20,
  ...supportedRinkebyERC777,
};
