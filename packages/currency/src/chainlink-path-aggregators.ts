import { RequestLogicTypes } from '@requestnetwork/types';
import GRAPH from 'node-dijkstra';
import { Currency } from './currency';

// List of currencies supported by network (can be generated from requestNetwork/toolbox/src/chainlinkConversionPathTools.ts)
// Network => currencyFrom => currencyTo => cost
// Must be updated every time an aggregator is added
const currencyPairs: any = {
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
  mainnet: {
    '0x4f99f266506be1475e943b2f097827011bfa4e93': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x775eb53d00dd0acd3ec1696472105d579b9b386b': {
      '0x4f99f266506be1475e943b2f097827011bfa4e93': 1,
      '0xfa6faefc053e6c8e393a73dcc12b09fcde019d25': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
      '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c': 1,
      '0x8290333cef9e6d528dd5618fb97a76f268f3edd4': 1,
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 1,
      '0xce80759e72fe1d3c07be79ffecc76a7a9b46c641': 1,
      '0xfac26e3fd40adcdc6652f705d983b4830c00716c': 1,
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 1,
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1,
      '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': 1,
      '0x17b4158805772ced11225e77339f90beb5aae968': 1,
      '0x6b175474e89094c44da98b954eedeac495271d0f': 1,
      '0x3845badade8e6dff049820680d1f14bd3903a5d0': 1,
      '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7': 1,
    },
    '0xfa6faefc053e6c8e393a73dcc12b09fcde019d25': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xf5af88e117747e87fc5929f2ff87221b1447652e': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c': 1,
      '0xa117000000f279d81a1d3cc75430faa017fa5a2e': 1,
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 1,
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 1,
      '0x4e15361fd6b4bb609fa63c81a2be19d873717870': 1,
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 1,
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1,
      '0x6b175474e89094c44da98b954eedeac495271d0f': 1,
      '0xc944e90c64b2c07662a292be6244bdf05cda44a7': 1,
      '0x967da4048cd07ab37855c090aaf366e4ce1b9f48': 1,
    },
    '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0xa117000000f279d81a1d3cc75430faa017fa5a2e': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x8290333cef9e6d528dd5618fb97a76f268f3edd4': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0xce80759e72fe1d3c07be79ffecc76a7a9b46c641': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xfac26e3fd40adcdc6652f705d983b4830c00716c': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x4e15361fd6b4bb609fa63c81a2be19d873717870': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x6b175474e89094c44da98b954eedeac495271d0f': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xc944e90c64b2c07662a292be6244bdf05cda44a7': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x967da4048cd07ab37855c090aaf366e4ce1b9f48': {
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x3845badade8e6dff049820680d1f14bd3903a5d0': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
  },
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
  currencyFrom: RequestLogicTypes.ICurrency,
  currencyTo: RequestLogicTypes.ICurrency,
  network = 'mainnet',
): string[] | null {
  if (!currencyPairs[network]) {
    throw Error(`network ${network} not supported`);
  }

  // load the Graph
  const route = new GRAPH(currencyPairs[network]);

  // Get the path
  return route.path(
    new Currency(currencyFrom).getHash().toLowerCase(),
    new Currency(currencyTo).getHash().toLowerCase(),
  );
}
