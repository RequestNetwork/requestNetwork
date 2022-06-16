import { supportedRinkebyERC777 } from './rinkeby';
import { supportedGoerliERC777 } from './goerli';
import type { TokenMap } from '../../erc20/networks/types';

export const supportedNetworks: Record<string, TokenMap> = {
  rinkeby: supportedRinkebyERC777,
  goerli: supportedGoerliERC777,
};

export type { TokenMap };
