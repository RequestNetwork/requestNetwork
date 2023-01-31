import { TokenMap } from '../types';
import { supportedBSCTestERC20 } from '../erc20/networks/bsctest';

export const chainId = 97;
export const currencies: TokenMap = {
  ...supportedBSCTestERC20,
};
