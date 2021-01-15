import { RequestLogicTypes } from '@requestnetwork/types';
import { getCurrencyHash } from './index';

const GRAPH = require('node-dijkstra');

const aggregators: any = {
  private: {
    '0x38cf23c52bb4b13f051aec09580a2de845a7fa35': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241',
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': '0xBd2c938B9F6Bfc1A66368D08CB44dC3EB2aE27bE',
    },
    '0xf5af88e117747e87fc5929f2ff87221b1447652e': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': '0x2a504B5e7eC284ACa5b6f49716611237239F0b97',
    },
    '0x8acee021a27779d8e98b9650722676b850b25e11': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': '0x2EcA6FCFef74E2c8D03fBAf0ff6712314c9BD58B',
    },
  },
  rinkeby: {
    '0xfab46e002bbf0b4509813474841e0716e6730136': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': '0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF',
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': '0x78F9e60608bF48a1155b4B2A5e31F32318a1d85F',
    },
    '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': '0x7B17A813eEC55515Fb8F49F2ef51502bC54DD40F',
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
  if (!aggregators[network]) {
    throw Error('network not supported');
  }

  // Include the reverse path of each aggregators
  const aggregatorsWithReverse: any = {};
  // tslint:disable-next-line:forin
  for (let ccyIn in aggregators[network]) {
    ccyIn = ccyIn.toLowerCase();
    if (!aggregatorsWithReverse[ccyIn]) {
      aggregatorsWithReverse[ccyIn] = {};
    }
    // tslint:disable-next-line:forin
    for (let ccyOut in aggregators[network][ccyIn]) {
      ccyOut = ccyOut.toLowerCase();
      if (!aggregatorsWithReverse[ccyOut]) {
        aggregatorsWithReverse[ccyOut] = {};
      }
      aggregatorsWithReverse[ccyIn][ccyOut] = 1;
      aggregatorsWithReverse[ccyOut][ccyIn] = 1;
    }
  }

  // load the Graph
  const route = new GRAPH(aggregatorsWithReverse);

  // Get the path
  return route.path(
    getCurrencyHash(currencyFrom).toLowerCase(),
    getCurrencyHash(currencyTo).toLowerCase(),
  );
}
