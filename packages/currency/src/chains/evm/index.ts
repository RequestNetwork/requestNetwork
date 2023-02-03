import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { EvmChainDefinition } from '../../types';
import { addNativeCurrenciesToChains, genericAssertChainSupported } from '../utils';

import * as AlfajoresDefinition from './alfajores';
import * as ArbitrumOneDefinition from './arbitrum-one';
import * as ArbitrumRinkebyDefinition from './arbitrum-rinkeby';
import * as AuroraDefinition from './aurora';
import * as AuroraTestnetDefinition from './aurora-testnet';
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
  aurora: AuroraDefinition,
  'aurora-testnet': AuroraTestnetDefinition,
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
  'near-testnet': AuroraTestnetDefinition,
  optimism: OptimismDefinition,
  private: PrivateDefinition,
  // FIXME: Rinkeby is deprecated
  rinkeby: RinkebyDefinition,
  ronin: RoninDefinition,
  sokol: SokolDefinition,
  tombchain: TombchainDefinition,
  xdai: XDaiDefinition,
};

export const chainNames = Object.keys(chains) as CurrencyTypes.EvmChainName[];

// add native currencies
addNativeCurrenciesToChains(chains, RequestLogicTypes.CURRENCY.ETH);

export function assertChainSupported(
  chainKey: string,
): asserts chainKey is CurrencyTypes.EvmChainName {
  genericAssertChainSupported<CurrencyTypes.EvmChainName>(chainKey, chainNames);
}

export const getChainId = (chainName: CurrencyTypes.EvmChainName): number =>
  chains[chainName].chainId;

export const getChainName = (chainId: number): CurrencyTypes.EvmChainName | undefined =>
  chainNames.find((chainName) => chains[chainName].chainId === chainId);
