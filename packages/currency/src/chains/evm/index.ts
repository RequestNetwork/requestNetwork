import { CurrencyTypes } from '@requestnetwork/types';

import * as AlfajoresDefinition from './data/alfajores';
import * as ArbitrumOneDefinition from './data/arbitrum-one';
import * as ArbitrumRinkebyDefinition from './data/arbitrum-rinkeby';
import * as AvalancheDefinition from './data/avalanche';
import * as BscDefinition from './data/bsc';
import * as BscTestDefinition from './data/bsctest';
import * as CeloDefinition from './data/celo';
import * as CoreDefinition from './data/core';
import * as FantomDefinition from './data/fantom';
import * as FuseDefinition from './data/fuse';
import * as GoerliDefinition from './data/goerli';
import * as MainnetDefinition from './data/mainnet';
import * as MantleDefinition from './data/mantle';
import * as MantleTestnetDefinition from './data/mantle-testnet';
import * as MaticDefinition from './data/matic';
import * as MoonbeamDefinition from './data/moonbeam';
import * as MumbaiDefinition from './data/mumbai';
import * as OptimismDefinition from './data/optimism';
import * as PrivateDefinition from './data/private';
import * as RinkebyDefinition from './data/rinkeby';
import * as RoninDefinition from './data/ronin';
import * as SokolDefinition from './data/sokol';
import * as TombchainDefinition from './data/tombchain';
import * as XDaiDefinition from './data/xdai';

export type EvmChain = CurrencyTypes.Chain & {
  chainId: number;
};

export const chains: Record<CurrencyTypes.EvmChainName, EvmChain> = {
  alfajores: AlfajoresDefinition,
  'arbitrum-one': ArbitrumOneDefinition,
  'arbitrum-rinkeby': ArbitrumRinkebyDefinition,
  avalanche: AvalancheDefinition,
  bsc: BscDefinition,
  bsctest: BscTestDefinition,
  celo: CeloDefinition,
  core: CoreDefinition,
  fantom: FantomDefinition,
  fuse: FuseDefinition,
  goerli: GoerliDefinition,
  mainnet: MainnetDefinition,
  mantle: MantleDefinition,
  'mantle-testnet': MantleTestnetDefinition,
  matic: MaticDefinition,
  moonbeam: MoonbeamDefinition,
  mumbai: MumbaiDefinition,
  optimism: OptimismDefinition,
  private: PrivateDefinition,
  rinkeby: RinkebyDefinition, // FIXME: Rinkeby is deprecated
  ronin: RoninDefinition,
  sokol: SokolDefinition,
  tombchain: TombchainDefinition,
  xdai: XDaiDefinition,
};
