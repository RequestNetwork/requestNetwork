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
      name: 'BNB',
      network: 'bsctest',
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
  ],
  [RequestLogicTypes.CURRENCY.BTC]: [
    {
      symbol: 'BTC',
      decimals: 8,
      name: 'Bitcoin',
      network: 'mainnet',
    },
    {
      symbol: 'BTC-testnet',
      decimals: 8,
      name: 'Test Bitcoin',
      network: 'testnet',
    },
  ],
};

export const getNativeSymbol = (type: keyof typeof nativeCurrencies, network?: string): string => {
  const currency = nativeCurrencies[type]?.find((x) => x.network === (network || 'mainnet'));
  if (currency) {
    return currency.symbol;
  }
  if (network !== 'mainnet') {
    return `${type}-${network}`;
  }
  return type;
};
