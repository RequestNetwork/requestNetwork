import { CurrencyTypes } from '@requestnetwork/types';
import { NetworkDefinition } from '../types';

import * as ArbitrumOneDefinition from './arbitrum-one';
import * as ArbitrumRinkebyDefinition from './arbitrum-rinkeby';
import * as AvalancheDefinition from './avalanche';
import * as BscDefinition from './bsc';
import * as BscTestDefinition from './bsctest';
import * as CeloDefinition from './celo';
import * as FantomDefinition from './fantom';
import * as FuseDefinition from './fuse';
import * as GoerliDefinition from './goerli';
import * as MainnetDefinition from './mainnet';
import * as MaticDefinition from './matic';
import * as MoonbeamDefinition from './moonbeam';
import * as MumbaiDefinition from './mumbai';
import * as OptimismDefinition from './optimism';
import * as PrivateDefinition from './private';
import * as RinkebyDefinition from './rinkeby';
import * as RoninDefinition from './ronin';
import * as TombchainDefinition from './tombchain';
import * as XDaiDefinition from './xdai';

export const networks: Record<CurrencyTypes.NetworkName, NetworkDefinition> = {
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
  matic: MaticDefinition,
  moonbeam: MoonbeamDefinition,
  mumbai: MumbaiDefinition,
  optimism: OptimismDefinition,
  private: PrivateDefinition,
  // FIXME: Rinkeby is deprecated
  rinkeby: RinkebyDefinition,
  ronin: RoninDefinition,
  tombchain: TombchainDefinition,
  xdai: XDaiDefinition,
};
