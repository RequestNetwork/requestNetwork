import { ChainDefinition } from '../../types';

import * as TronDefinition from './data/tron';
import * as SolanaDefinition from './data/solana';
import { DeclarativeChain } from './declarative-chain';
import { initializeChains } from '../utils';

const chainDefinitions: Record<string, ChainDefinition> = {
  tron: TronDefinition,
  solana: SolanaDefinition,
};

export const chains = initializeChains(DeclarativeChain, chainDefinitions);
