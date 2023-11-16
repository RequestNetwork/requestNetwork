import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

type NativeEthCurrency = CurrencyTypes.NamedNativeCurrency & {
  network: CurrencyTypes.EvmChainName | CurrencyTypes.NearChainName;
};
type NativeBtcCurrency = CurrencyTypes.NamedNativeCurrency & {
  network: CurrencyTypes.BtcChainName;
};

export const nativeCurrencies: Record<RequestLogicTypes.CURRENCY.ETH, NativeEthCurrency[]> &
  Record<RequestLogicTypes.CURRENCY.BTC, NativeBtcCurrency[]> = {
  [RequestLogicTypes.CURRENCY.ETH]: [
    {
      symbol: 'ETH-private',
      decimals: 18,
      name: 'Ether',
      network: 'private',
    },
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
      symbol: 'ETH-goerli',
      decimals: 18,
      name: 'Goerli Ether',
      network: 'goerli',
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
      symbol: 'NEAR-testnet',
      decimals: 24,
      name: 'Test Near',
      network: 'near-testnet',
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
    {
      symbol: 'ETH-optimism',
      decimals: 18,
      name: 'Optimism Ether',
      network: 'optimism',
    },
    {
      symbol: 'GLMR',
      decimals: 18,
      name: 'Glimmer',
      network: 'moonbeam',
    },
    {
      symbol: 'TOMB',
      decimals: 18,
      name: 'Tomb',
      network: 'tombchain',
    },
    {
      symbol: 'MNT',
      decimals: 18,
      name: 'Mantle',
      network: 'mantle',
    },
    {
      symbol: 'MNT-testnet',
      decimals: 18,
      name: 'Mantle Testnet',
      network: 'mantle-testnet',
    },
    {
      symbol: 'CORE',
      decimals: 18,
      name: 'Core',
      network: 'core',
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
