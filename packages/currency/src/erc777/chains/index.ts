import { supportedRinkebyERC777 } from './rinkeby';
import { TokenMap } from '../../types';

export const supportedNetworks: Record<string, TokenMap> = {
  rinkeby: supportedRinkebyERC777,
};
