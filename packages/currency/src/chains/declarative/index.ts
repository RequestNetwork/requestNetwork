import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types.js';

import * as TronDefinition from './data/tron.js';
import * as SolanaDefinition from './data/solana.js';

export type DeclarativeChain = Chain;

export const chains: Record<CurrencyTypes.DeclarativeChainName, DeclarativeChain> = {
  tron: TronDefinition,
  solana: SolanaDefinition,
};
