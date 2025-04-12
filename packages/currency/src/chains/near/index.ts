import { CurrencyTypes } from '@requestnetwork/types';

import * as NearDefinition from './data/near';
import * as NearTestnetDefinition from './data/near-testnet';

export type NearChain = CurrencyTypes.Chain;

export const chains: Record<CurrencyTypes.NearChainName, NearChain> = {
  aurora: NearDefinition,
  'aurora-testnet': NearTestnetDefinition,
  near: NearDefinition,
  'near-testnet': NearTestnetDefinition,
};
