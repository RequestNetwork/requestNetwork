import { CurrencyTypes } from '@requestnetwork/types';

import * as TronDefinition from './data/tron';
import * as SolanaDefinition from './data/solana';

export type DeclarativeChain = CurrencyTypes.Chain;

export const chains: Record<CurrencyTypes.DeclarativeChainName, DeclarativeChain> = {
  tron: TronDefinition,
  solana: SolanaDefinition,
};
