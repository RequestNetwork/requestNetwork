import { ChainDefinition } from '../../types';

import * as MainnetDefinition from './data/mainnet';
import * as TestnetDefinition from './data/testnet';
import { BtcChain } from './btc-chain';
import { initializeChains } from '../utils';

const chainDefinitions: Record<string, ChainDefinition> = {
  mainnet: MainnetDefinition,
  testnet: TestnetDefinition,
};

export const chains = initializeChains(BtcChain, chainDefinitions);
