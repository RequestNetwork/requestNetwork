import GRAPH from 'node-dijkstra';
import { CurrencyDefinition } from './types';
import { RequestLogicTypes } from '@requestnetwork/types';

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
      '0x2ae72ebc9eb4738b1e1e1cc4ec878ee2c4f5b923': 1,
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x2ae72ebc9eb4738b1e1e1cc4ec878ee2c4f5b923': {
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
  matic: {
    '0xfa6faefc053e6c8e393a73dcc12b09fcde019d25': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x775eb53d00dd0acd3ec1696472105d579b9b386b': {
      '0xfa6faefc053e6c8e393a73dcc12b09fcde019d25': 1,
      '0xce80759e72fe1d3c07be79ffecc76a7a9b46c641': 1,
      '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': 1,
      '0x17b4158805772ced11225e77339f90beb5aae968': 1,
      '0x4f99f266506be1475e943b2f097827011bfa4e93': 1,
      '0xfac26e3fd40adcdc6652f705d983b4830c00716c': 1,
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 1,
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 1,
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 1,
      '0x831753dd7087cac61ab5644b308642cc1c33dc13': 1,
    },
    '0xce80759e72fe1d3c07be79ffecc76a7a9b46c641': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x17b4158805772ced11225e77339f90beb5aae968': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x4f99f266506be1475e943b2f097827011bfa4e93': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xfac26e3fd40adcdc6652f705d983b4830c00716c': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0xf5af88e117747e87fc5929f2ff87221b1447652e': {
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 1,
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 1,
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 1,
      '0x831753dd7087cac61ab5644b308642cc1c33dc13': 1,
    },
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
    '0x831753dd7087cac61ab5644b308642cc1c33dc13': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
      '0xf5af88e117747e87fc5929f2ff87221b1447652e': 1,
    },
  },
  fantom: {
    '0xfac26e3fd40adcdc6652f705d983b4830c00716c': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x775eb53d00dd0acd3ec1696472105d579b9b386b': {
      '0xfac26e3fd40adcdc6652f705d983b4830c00716c': 1,
      '0x10bf4137b0558c33c2dc9f71c3bb81c2865fa2fb': 1,
      '0x6a07a792ab2965c72a5b8088d3a069a7ac3a993b': 1,
      '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e': 1,
      '0x657a1861c15a3ded9af0b6799a195a249ebdcbc6': 1,
      '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e': 1,
      '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad': 1,
      '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8': 1,
      '0x56ee926bd8c72b2d5fa1af4d9e4cbb515a1e3adc': 1,
      '0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc': 1,
      '0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5': 1,
      '0x04068da6c83afcfa0e13ba15a6696662335d5b75': 1,
    },
    '0x10bf4137b0558c33c2dc9f71c3bb81c2865fa2fb': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x6a07a792ab2965c72a5b8088d3a069a7ac3a993b': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x657a1861c15a3ded9af0b6799a195a249ebdcbc6': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x56ee926bd8c72b2d5fa1af4d9e4cbb515a1e3adc': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5': {
      '0x775eb53d00dd0acd3ec1696472105d579b9b386b': 1,
    },
    '0x04068da6c83afcfa0e13ba15a6696662335d5b75': {
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
  currencyFrom: Pick<CurrencyDefinition, 'hash'>,
  currencyTo: Pick<CurrencyDefinition, 'hash'>,
  network = 'mainnet',
): string[] | null {
  if (!currencyPairs[network]) {
    throw Error(`network ${network} not supported`);
  }

  // load the Graph
  const route = new GRAPH(currencyPairs[network]);

  // Get the path
  return route.path(currencyFrom.hash.toLowerCase(), currencyTo.hash.toLowerCase());
}

/**
 * These currencies are supported by Chainlink for conversion.
 */
export const supportedCurrencies: Record<string, Record<RequestLogicTypes.CURRENCY, string[]>> = {
  private: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['USD', 'EUR'],
    [RequestLogicTypes.CURRENCY.ERC20]: ['0x38cf23c52bb4b13f051aec09580a2de845a7fa35'],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  rinkeby: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['EUR', 'GBP', 'USD'],
    [RequestLogicTypes.CURRENCY.ERC20]: ['0xfab46e002bbf0b4509813474841e0716e6730136'],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH-rinkeby'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  mainnet: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'SGD', 'USD'],
    [RequestLogicTypes.CURRENCY.ERC20]: [

      '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
      '0x3845badade8e6dff049820680d1f14bd3903a5d0',
      '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
      '0x6b175474e89094c44da98b954eedeac495271d0f',
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      '0x8290333cef9e6d528dd5618fb97a76f268f3edd4',
      '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7',
      '0x967da4048cd07ab37855c090aaf366e4ce1b9f48',
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0xa117000000f279d81a1d3cc75430faa017fa5a2e',
      '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    ],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  matic: {
    [RequestLogicTypes.CURRENCY.ISO4217]: ['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'SGD', 'USD'],
    [RequestLogicTypes.CURRENCY.ERC20]: [
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      '0x831753dd7087cac61ab5644b308642cc1c33dc13',
    ],
    [RequestLogicTypes.CURRENCY.ETH]: ['ETH'],
    [RequestLogicTypes.CURRENCY.BTC]: [],
  },
  fantom: {
    ISO4217: ['CHF', 'USD'],
    ERC20: [
      '0x10bf4137b0558c33c2dc9f71c3bb81c2865fa2fb',
      '0x6a07a792ab2965c72a5b8088d3a069a7ac3a993b',
      '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e',
      '0x657a1861c15a3ded9af0b6799a195a249ebdcbc6',
      '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
      '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad',
      '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8',
      '0x56ee926bd8c72b2d5fa1af4d9e4cbb515a1e3adc',
      '0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc',
      '0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5',
      '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
    ],
    ETH: [],
    BTC: [],
  },
};
