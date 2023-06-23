import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as TronDefinition from './data/tron';

export type DeclarativeChain = Chain;

export const chains: Record<CurrencyTypes.DeclarativeChainName, DeclarativeChain> = {
  tron: TronDefinition,
};
