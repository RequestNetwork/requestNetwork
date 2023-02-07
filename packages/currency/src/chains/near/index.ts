import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as NearDefinition from './data/near';
import * as NearTestnetDefinition from './data/near-testnet';

export type NearChain = Chain;

export const chains: Record<CurrencyTypes.NearChainName, NearChain> = {
  aurora: NearDefinition, // FIXME: aurora should be removed from near chains (it is a mistake)
  'aurora-testnet': NearTestnetDefinition, // FIXME: aurora should be removed from near chains (it is a mistake)
  near: NearDefinition,
  'near-testnet': NearTestnetDefinition,
};
