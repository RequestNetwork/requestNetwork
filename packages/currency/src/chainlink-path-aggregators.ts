import GRAPH from 'node-dijkstra';
import { CurrencyDefinition } from './types';

import privateAggregator from './aggregators/private.json';
import mainnetAggregator from './aggregators/mainnet.json';
import rinkebyAggregator from './aggregators/rinkeby.json';
import maticAggregator from './aggregators/matic.json';
import fantomAggregator from './aggregators/fantom.json';

// List of currencies supported by network (can be generated from requestNetwork/toolbox/src/chainlinkConversionPathTools.ts)
// Network => currencyFrom => currencyTo => cost
// Must be updated every time an aggregator is added
export const chainlinkCurrencyPairs: any = {
  private: privateAggregator,
  rinkeby: rinkebyAggregator,
  mainnet: mainnetAggregator,
  matic: maticAggregator,
  fantom: fantomAggregator,
};

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
): string[] | null {
  if (!chainlinkCurrencyPairs[network]) {
    throw Error(`network ${network} not supported`);
  }

  // load the Graph
  const route = new GRAPH(chainlinkCurrencyPairs[network]);

  // Get the path
  return route.path(currencyFrom.hash.toLowerCase(), currencyTo.hash.toLowerCase());
}
