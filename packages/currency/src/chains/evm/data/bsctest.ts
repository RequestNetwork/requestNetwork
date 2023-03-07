import { TokenMap } from '../../../types';
import { supportedBSCTestERC20 } from '../../../erc20/chains/bsctest';

export const chainId = 97;
export const currencies: TokenMap = {
  ...supportedBSCTestERC20,
};
