import { CurrencyTypes } from '@requestnetwork/types';
import { supportedBaseSepoliaERC20 } from '../../../erc20/chains/base-sepolia';

export const chainId = 84532;
export const testnet = true;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedBaseSepoliaERC20,
};
