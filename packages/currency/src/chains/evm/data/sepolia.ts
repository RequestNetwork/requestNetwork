import { CurrencyTypes } from '@requestnetwork/types';
import { supportedSepoliaERC20 } from '../../../erc20/chains/sepolia';

export const chainId = 11155111;
export const testnet = true;
export const currencies: CurrencyTypes.TokenMap = {
  ...supportedSepoliaERC20,
};
