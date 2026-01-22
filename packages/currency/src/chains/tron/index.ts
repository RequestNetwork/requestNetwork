import { CurrencyTypes } from '@requestnetwork/types';

import * as TronDefinition from '../declarative/data/tron';
import * as NileDefinition from '../declarative/data/nile';

export type TronChain = CurrencyTypes.Chain;

export const chains: Record<CurrencyTypes.TronChainName, TronChain> = {
  tron: TronDefinition,
  nile: NileDefinition,
};
