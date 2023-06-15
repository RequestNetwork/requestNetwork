import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as TronDefinition from './data/tron';

export type TronChain = Chain;

export const chains: Record<CurrencyTypes.TronChainName, TronChain> = {
  tron: TronDefinition,
};
