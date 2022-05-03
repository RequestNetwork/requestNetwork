import { supportedRinkebyERC777 } from './rinkeby';
import type { TokenMap } from '../../erc20/networks/types';

export const supportedNetworks: Record<string, TokenMap> = {
  rinkeby: supportedRinkebyERC777,
};

export type { TokenMap };
