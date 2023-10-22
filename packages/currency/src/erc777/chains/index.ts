import { supportedRinkebyERC777 } from './rinkeby.js';
import { TokenMap } from '../../types.js';
import { CurrencyTypes } from '@requestnetwork/types';

export const supportedNetworks: Partial<Record<CurrencyTypes.EvmChainName, TokenMap>> = {
  rinkeby: supportedRinkebyERC777,
};
