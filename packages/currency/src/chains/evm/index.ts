import { CurrencyTypes } from '@requestnetwork/types';
import { Chain } from '../../types';

import * as AlfajoresDefinition from './data/alfajores.js';
import * as ArbitrumOneDefinition from './data/arbitrum-one.js';
import * as ArbitrumRinkebyDefinition from './data/arbitrum-rinkeby.js';
import * as AvalancheDefinition from './data/avalanche.js';
import * as BscDefinition from './data/bsc.js';
import * as BscTestDefinition from './data/bsctest.js';
import * as CeloDefinition from './data/celo.js';
import * as FantomDefinition from './data/fantom.js';
import * as FuseDefinition from './data/fuse.js';
import * as GoerliDefinition from './data/goerli.js';
import * as MainnetDefinition from './data/mainnet.js';
import * as MantleDefinition from './data/mantle.js';
import * as MantleTestnetDefinition from './data/mantle-testnet.js';
import * as MaticDefinition from './data/matic.js';
import * as MoonbeamDefinition from './data/moonbeam.js';
import * as MumbaiDefinition from './data/mumbai.js';
import * as OptimismDefinition from './data/optimism.js';
import * as PrivateDefinition from './data/private.js';
import * as RinkebyDefinition from './data/rinkeby.js';
import * as RoninDefinition from './data/ronin.js';
import * as SokolDefinition from './data/sokol.js';
import * as TombchainDefinition from './data/tombchain.js';
import * as XDaiDefinition from './data/xdai.js';

export type EvmChain = Chain & {
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
