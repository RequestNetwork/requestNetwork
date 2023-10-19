import { TokenMap } from '../../../types.js';
import { supportedBSCTestERC20 } from '../../../erc20/chains/bsctest.js';

export const chainId = 97;
export const currencies: TokenMap = {
  ...supportedBSCTestERC20,
};
