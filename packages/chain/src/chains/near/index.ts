import * as NearDefinition from './data/near';
import * as NearTestnetDefinition from './data/near-testnet';
import { ChainDefinition } from '../../types';
import { initializeChains } from '../utils';
import { NearChain } from './near-chain';

const chainDefinitions: Record<string, ChainDefinition> = {
  aurora: NearDefinition,
  'aurora-testnet': NearTestnetDefinition,
  near: NearDefinition,
  'near-testnet': NearTestnetDefinition,
};

export const chains = initializeChains(NearChain, chainDefinitions);
