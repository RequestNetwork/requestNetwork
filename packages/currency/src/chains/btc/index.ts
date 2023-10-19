import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as MainnetDefinition from './data/mainnet.js';
import * as TestnetDefinition from './data/testnet.js';

export type BtcChain = Chain & {
  chainId: string;
};

export const chains: Record<CurrencyTypes.BtcChainName, BtcChain> = {
  mainnet: MainnetDefinition,
  testnet: TestnetDefinition,
};
