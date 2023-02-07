import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { EvmChainDefinition } from '../../types';
import {
  addNativeCurrenciesToChains,
  genericAssertChainSupported,
  genericGetChainId,
  genericGetChainName,
} from '../utils';

import * as AlfajoresDefinition from './alfajores';
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
import * as SokolDefinition from './sokol';
import * as TombchainDefinition from './tombchain';
import * as XDaiDefinition from './xdai';

export const chains: Record<CurrencyTypes.EvmChainName, EvmChainDefinition> = {
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

export const chainNames = Object.keys(chains) as CurrencyTypes.EvmChainName[];

// add native currencies
addNativeCurrenciesToChains(chains, RequestLogicTypes.CURRENCY.ETH);

/**
 * Asserts if a specific chain is supported across EVM-type supported chains
 */
export const assertChainSupported =
  genericAssertChainSupported<CurrencyTypes.EvmChainName>(chainNames);

/**
 * Get the EVM chain ID from the chain name
 */
export const getChainId = genericGetChainId<CurrencyTypes.EvmChainName, EvmChainDefinition, number>(
  chains,
);

/**
 * Get the EVM chain name from its ID
 */
export const getChainName = genericGetChainName<
  CurrencyTypes.EvmChainName,
  EvmChainDefinition,
  number
>(chains, chainNames);
