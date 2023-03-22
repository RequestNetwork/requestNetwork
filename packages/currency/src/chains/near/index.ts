import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as NearDefinition from './data/near';
import * as NearTestnetDefinition from './data/near-testnet';

export type NearChain = Chain;

export const chains: Record<CurrencyTypes.NearChainName, NearChain> = {
  aurora: NearDefinition,
  'aurora-testnet': NearTestnetDefinition,
  // near: NearDefinition, // TODO: add support for near
  'near-testnet': NearTestnetDefinition,
};
