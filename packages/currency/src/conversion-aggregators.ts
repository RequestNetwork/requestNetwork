import GRAPH from 'node-dijkstra';
import { CurrencyTypes } from '@requestnetwork/types';

import privateAggregator from './aggregators/private.json';
import mainnetAggregator from './aggregators/mainnet.json';
import goerliAggregator from './aggregators/goerli.json';
import sepoliaAggregator from './aggregators/sepolia.json';
import rinkebyAggregator from './aggregators/rinkeby.json';
import maticAggregator from './aggregators/matic.json';
import fantomAggregator from './aggregators/fantom.json';
import xdaiAggregator from './aggregators/xdai.json';
import arbitrumOneAggregator from './aggregators/arbitrum-one.json';
import avalancheAggregator from './aggregators/avalanche.json';
import bscAggregator from './aggregators/bsc.json';
import optimismAggregator from './aggregators/optimism.json';
import baseAggregator from './aggregators/base.json';

// Pairs supported by Chainlink (can be generated from requestNetwork/toolbox/src/chainlinkConversionPathTools.ts)
const chainlinkCurrencyPairs: CurrencyTypes.AggregatorsMap<CurrencyTypes.EvmChainName> = {
  private: privateAggregator,
  goerli: goerliAggregator,
  rinkeby: rinkebyAggregator,
  mainnet: mainnetAggregator,
  matic: maticAggregator,
  fantom: fantomAggregator,
  sepolia: sepoliaAggregator,
  xdai: xdaiAggregator,
  'arbitrum-one': arbitrumOneAggregator,
  avalanche: avalancheAggregator,
  bsc: bscAggregator,
  optimism: optimismAggregator,
  base: baseAggregator,
};

// FIXME: This fix enables to get these networks registered in conversionSupportedNetworks.
// Could be improved by removing the supported network check from the protocol
const noConversionNetworks: CurrencyTypes.AggregatorsMap = {
  'arbitrum-rinkeby': {},
  moonbeam: {},
  // FIXME: Near should get conversion again with Pyth. See './aggregators/near-testnet.json' and './aggregators/near.json';
  aurora: {},
  'aurora-testnet': {},
  celo: {},
  sonic: {},
};

/**
 * Conversion paths per network used by default if no other path given to the Currency Manager.
 * Must be updated every time an aggregator is added to one network.
 */
export const defaultConversionPairs: CurrencyTypes.AggregatorsMap = {
  ...chainlinkCurrencyPairs,
  ...noConversionNetworks,
};

export const conversionSupportedNetworks = Object.keys(
  defaultConversionPairs,
) as CurrencyTypes.ChainName[];

/**
 * Gets the on-chain conversion path between two currencies.
 * The path is used to value currencyFrom against currencyTo.
 *
 * @param currencyFrom currency from
 * @param currencyTo currency to
 * @param network ethereum network (default: 'mainnet')
 *
 * @returns conversion path
 */
export function getPath(
  currencyFrom: Pick<CurrencyTypes.CurrencyDefinition, 'hash'>,
  currencyTo: Pick<CurrencyTypes.CurrencyDefinition, 'hash'>,
  network: CurrencyTypes.ChainName = 'mainnet',
  pairs = defaultConversionPairs,
): string[] | null {
  if (!pairs[network]) {
    throw Error(`network ${network} not supported`);
  }

  // load the Graph
  const route = new GRAPH(pairs[network] as any);

  // Get the path
  return route.path(currencyFrom.hash.toLowerCase(), currencyTo.hash.toLowerCase());
}
