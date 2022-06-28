import GRAPH from 'node-dijkstra';
import { CurrencyDefinition } from './types';

import privateAggregator from './aggregators/private.json';
import mainnetAggregator from './aggregators/mainnet.json';
import rinkebyAggregator from './aggregators/rinkeby.json';
import goerliAggregator from './aggregators/goerli.json';
import maticAggregator from './aggregators/matic.json';
import fantomAggregator from './aggregators/fantom.json';

export type CurrencyPairs = Record<string, Record<string, number>>;
// List of currencies supported by network (can be generated from requestNetwork/toolbox/src/chainlinkConversionPathTools.ts)
// Network => currencyFrom => currencyTo => cost
// Must be updated every time an aggregator is added
export const chainlinkCurrencyPairs: Record<string, CurrencyPairs> = {
  private: privateAggregator,
  rinkeby: rinkebyAggregator,
  mainnet: mainnetAggregator,
  matic: maticAggregator,
  fantom: fantomAggregator,
  // FIX ME: This fix enables to get these networks registered in chainlinkSupportedNetworks.
  // Could be improved by removing the supported network check from the protocol
  'arbitrum-rinkeby': {},
  'arbitrum-one': {},
  xdai: {},
  avalanche: {},
  bsc: {},
  // FIX ME: There are still no Goerli chainlink oracles but we added these few for the tests to pass.
  goerli: goerliAggregator,
};

export const chainlinkSupportedNetworks = Object.keys(chainlinkCurrencyPairs);

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
  pairs = chainlinkCurrencyPairs,
): string[] | null {
  if (!pairs[network]) {
    throw Error(`network ${network} not supported`);
  }

  // load the Graph
  const route = new GRAPH(pairs[network] as any);

  // Get the path
  return route.path(currencyFrom.hash.toLowerCase(), currencyTo.hash.toLowerCase());
}
