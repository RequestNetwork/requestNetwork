import { supportedRinkebyERC777 } from './rinkeby';
import { TokenMap } from '../../types';
import { CurrencyTypes } from '@requestnetwork/types';

export const supportedNetworks: Partial<Record<CurrencyTypes.EvmChainName, TokenMap>> = {
  rinkeby: supportedRinkebyERC777,
};

export type { TokenMap };
