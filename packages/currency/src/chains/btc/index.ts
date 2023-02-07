import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as MainnetDefinition from './data/mainnet';
import * as TestnetDefinition from './data/testnet';

export type BtcChain = Chain & {
  chainId: string;
};

export const chains: Record<CurrencyTypes.BtcChainName, BtcChain> = {
  mainnet: MainnetDefinition,
  testnet: TestnetDefinition,
};
