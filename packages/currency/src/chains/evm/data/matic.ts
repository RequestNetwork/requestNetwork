import { TokenMap } from '../../../types';
import { supportedMaticERC20 } from '../../../erc20/chains/matic';

export const chainId = 137;
export const currencies: TokenMap = {
  ...supportedMaticERC20,
};
