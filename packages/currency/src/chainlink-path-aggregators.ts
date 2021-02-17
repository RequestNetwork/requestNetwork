import { RequestLogicTypes } from '@requestnetwork/types';
import { getCurrencyHash } from './index';

const GRAPH = require('node-dijkstra');

// List of aggregators nodes by network (can be generated from requestNetwork/toolbox/src/chainlinkConversionPathTools.ts)
// It represents a graph of currency per network: Network => currencyFrom => currencyTo => cost (all currency pair have the same cost)
const aggregatorsNodes: any = {
  private: {
    '0x38cf23c52bb4b13f051aec09580a2de845a7fa35': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x775eb53d00dd0acd3ec1696472105d579b9b386b': {
      '0x38cf23c52bb4b13f051aec09580a2de845a7fa35': 1,
      '0x17b4158805772ced11225e77339f90beb5aae968': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xf5af88e117747e87fc5929f2ff87221b1447652e': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0x8acee021a27779d8e98b9650722676b850b25e11': 1,
    },
    '0x8acee021a27779d8e98b9650722676b850b25e11': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
  },
  rinkeby: {
    '0xfab46e002bbf0b4509813474841e0716e6730136': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x775eb53d00dd0acd3ec1696472105d579b9b386b': {
      '0xfab46e002bbf0b4509813474841e0716e6730136': 1,
      '0x17b4158805772ced11225e77339f90beb5aae968': 1,
      '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': 1,
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
  },
};

/**
 * Gets the conversion path between two currencies
 *
 * @param currencyFrom currency from
 * @param currencyTo currency to
 * @param network ethereum network (default: 'mainnet')
 *
 * @returns conversion path
 */
export function getPath(
  currencyFrom: RequestLogicTypes.ICurrency,
  currencyTo: RequestLogicTypes.ICurrency,
  network: string = 'mainnet',
): string[] | null {
  if (!aggregatorsNodes[network]) {
    throw Error('network not supported');
  }

  // load the Graph
  const route = new GRAPH(aggregatorsNodes[network]);

  // Get the path
  return route.path(
    getCurrencyHash(currencyFrom).toLowerCase(),
    getCurrencyHash(currencyTo).toLowerCase(),
  );
}
