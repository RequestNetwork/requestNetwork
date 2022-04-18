import { RequestLogicTypes } from '@requestnetwork/types';
import { NativeCurrency, NativeCurrencyType } from './types';

export const nativeCurrencies: NativeCurrency[] = [
  {
    symbol: 'ETH',
    decimals: 18,
    name: 'Ether',
    network: 'mainnet',
  },
  {
    symbol: 'ETH-rinkeby',
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
    symbol: 'POA',
    decimals: 18,
    name: 'POA Sokol Ether',
    network: 'sokol',
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
  {
    symbol: 'FTM',
    decimals: 18,
    name: 'Fantom',
    network: 'fantom',
  },
  {
    symbol: 'BNB',
    decimals: 18,
    name: 'BNB Testnet',
    network: 'bsctest',
  },
  {
    symbol: 'BNB',
    decimals: 18,
    name: 'BNB',
    network: 'bsc',
  },
  {
    symbol: 'NEAR',
    decimals: 24,
    name: 'Near',
    network: 'aurora',
  },
  {
    symbol: 'NEAR-testnet',
    decimals: 24,
    name: 'Near Testnet',
    network: 'aurora-testnet',
  },
  {
    symbol: 'ARETH',
    decimals: 18,
    name: 'Arbitrum Testnet',
    network: 'arbitrum-rinkeby',
  },
  {
    symbol: 'AETH',
    decimals: 18,
    name: 'Arbitrum Ether',
    network: 'arbitrum-one',
  },
  {
    symbol: 'AVAX',
    decimals: 18,
    name: 'AVAX',
    network: 'avalanche',
  },
]
  .map((x) => ({
    type: RequestLogicTypes.CURRENCY.ETH as NativeCurrencyType,
    ...x,
  }))
  .concat(
    {
      type: RequestLogicTypes.CURRENCY.BTC,
      symbol: 'BTC',
      decimals: 8,
      name: 'Bitcoin',
      network: 'mainnet',
    },
    {
      type: RequestLogicTypes.CURRENCY.BTC,
      symbol: 'BTC-testnet',
      decimals: 8,
      name: 'Test Bitcoin',
      network: 'testnet',
    },
  );
