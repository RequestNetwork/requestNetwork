import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types.js';

import * as NearDefinition from './data/near.js';
import * as NearTestnetDefinition from './data/near-testnet.js';

export type NearChain = Chain;

export const chains: Record<CurrencyTypes.NearChainName, NearChain> = {
  aurora: NearDefinition,
  'aurora-testnet': NearTestnetDefinition,
  near: NearDefinition,
  'near-testnet': NearTestnetDefinition,
};
