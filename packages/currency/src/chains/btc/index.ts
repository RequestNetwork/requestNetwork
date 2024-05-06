import { CurrencyTypes } from '@requestnetwork/types';

import * as MainnetDefinition from './data/mainnet';
import * as TestnetDefinition from './data/testnet';

export type BtcChain = CurrencyTypes.Chain & {
  chainId: string;
};

export const chains: Record<CurrencyTypes.BtcChainName, BtcChain> = {
  mainnet: MainnetDefinition,
  testnet: TestnetDefinition,
};
