import { CurrencyTypes } from '@requestnetwork/types';

import * as SolanaDefinition from './data/solana';
import * as StarknetDefinition from './data/starknet';
import * as TonDefinition from './data/ton';
import * as AleoDefinition from './data/aleo';
import * as SuiDefinition from './data/sui';

export type DeclarativeChain = CurrencyTypes.Chain;

export const chains: Record<CurrencyTypes.DeclarativeChainName, DeclarativeChain> = {
  solana: SolanaDefinition,
  starknet: StarknetDefinition,
  ton: TonDefinition,
  aleo: AleoDefinition,
  sui: SuiDefinition,
};
