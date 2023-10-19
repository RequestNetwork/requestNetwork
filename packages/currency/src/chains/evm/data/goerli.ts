import { TokenMap } from '../../../types.js';
import { supportedGoerliERC20 } from '../../../erc20/chains/goerli.js';

export const chainId = 5;
export const testnet = true;
export const currencies: TokenMap = {
  ...supportedGoerliERC20,
};
