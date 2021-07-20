import { RequestLogicTypes } from '@requestnetwork/types';

export const nativeCurrencies = {
  [RequestLogicTypes.CURRENCY.ETH]: [
    {
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
      network: 'mainnet',
    },
    {
      symbol: 'ETH',
      decimals: 18,
      name: 'Rinkeby Ether',
      network: 'rinkeby',
    },
    {
      symbol: 'MATIC',
      decimals: 18,
      name: 'Matic',
      network: 'matic',
    },
    {
      symbol: 'xDAI',
      decimals: 18,
      name: 'xDAI',
      network: 'xdai',
    },
    {
      symbol: 'FUSE',
      decimals: 18,
      name: 'FUSE',
      network: 'fuse',
    },
    {
      symbol: 'CELO',
      decimals: 18,
      name: 'CELO',
      network: 'celo',
    },
  ],
  [RequestLogicTypes.CURRENCY.BTC]: [
    {
      symbol: 'BTC',
      decimals: 8,
      name: 'Bitcoin',
      network: 'mainnet',
    },
    {
      symbol: 'BTC',
      decimals: 8,
      name: 'Test Bitcoin',
      network: 'testnet',
    },
  ],
};
