import GRAPH from 'node-dijkstra';
import { CurrencyDefinition } from './types';

import privateAggregator from './aggregators/private.json';
import mainnetAggregator from './aggregators/mainnet.json';
import rinkebyAggregator from './aggregators/rinkeby.json';
import maticAggregator from './aggregators/matic.json';
import fantomAggregator from './aggregators/fantom.json';
import nearAggregator from './aggregators/near.json';
import nearTestnetAggregator from './aggregators/near-testnet.json';

/**
 * currencyFrom => currencyTo => cost
 */
export type CurrencyPairs = Record<string, Record<string, number>>;

/**
 * Aggregators maps define pairs of currencies for which an onchain oracle exists, by network.
 *
 * Network => currencyFrom => currencyTo => cost
 */
export type AggregatorsMap = Record<string, CurrencyPairs>;

// Pairs supported by Chainlink (can be generated from requestNetwork/toolbox/src/chainlinkConversionPathTools.ts)
const chainlinkCurrencyPairs: AggregatorsMap = {
  private: privateAggregator,
  rinkeby: rinkebyAggregator,
  mainnet: mainnetAggregator,
  matic: maticAggregator,
  fantom: fantomAggregator,
};

// Pairs supported by Flux Protocol
const fluxCurrencyPairs: AggregatorsMap = {
  aurora: nearAggregator,
  'aurora-testnet': nearTestnetAggregator,
};

// FIX ME: This fix enables to get these networks registered in conversionSupportedNetworks.
// Could be improved by removing the supported network check from the protocol
const noConversionNetworks: AggregatorsMap = {
  goerli: {},
  'arbitrum-rinkeby': {},
  'arbitrum-one': {},
  xdai: {},
  avalanche: {},
  bsc: {},
};

/**
 * Conversion paths per network used by default if no other path given to the Currency Manager.
 * Must be updated every time an aggregator is added to one network.
 */
export const defaultConversionPairs: AggregatorsMap = {
  ...chainlinkCurrencyPairs,
  ...fluxCurrencyPairs,
  ...noConversionNetworks,
};

export const conversionSupportedNetworks = Object.keys(defaultConversionPairs);

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
  currencyFrom: Pick<CurrencyDefinition, 'hash'>,
  currencyTo: Pick<CurrencyDefinition, 'hash'>,
  network = 'mainnet',
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
