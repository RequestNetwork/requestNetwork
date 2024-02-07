import { RequestLogicTypes } from '@requestnetwork/types';
import { NativeCurrency, NativeCurrencyInput, TokenMap } from './types';

export const nativeCurrencies: Record<
  RequestLogicTypes.CURRENCY.BTC | RequestLogicTypes.CURRENCY.ETH,
  TokenMap
> = {
  [RequestLogicTypes.CURRENCY.ETH]: {
    private: {
      symbol: 'ETH-private',
      decimals: 18,
      name: 'Ether',
    },
    mainnet: {
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
    },
    rinkeby: {
      symbol: 'ETH-rinkeby',
      decimals: 18,
      name: 'Rinkeby Ether',
    },
    goerli: {
      symbol: 'ETH-goerli',
      decimals: 18,
      name: 'Goerli Ether',
    },
    matic: {
      symbol: 'MATIC',
      decimals: 18,
      name: 'Matic',
    },
    xdai: {
      symbol: 'xDAI',
      decimals: 18,
      name: 'xDAI',
    },
    sokol: {
      symbol: 'POA',
      decimals: 18,
      name: 'POA Sokol Ether',
    },
    fuse: {
      symbol: 'FUSE',
      decimals: 18,
      name: 'FUSE',
    },
    celo: {
      symbol: 'CELO',
      decimals: 18,
      name: 'CELO',
    },
    fantom: {
      symbol: 'FTM',
      decimals: 18,
      name: 'Fantom',
    },
    bsc: {
      symbol: 'BNB',
      decimals: 18,
      name: 'BNB',
    },
    aurora: {
      symbol: 'NEAR',
      decimals: 24,
      name: 'Near',
    },
    'aurora-testnet': {
      symbol: 'NEAR-testnet',
      decimals: 24,
      name: 'Near Testnet',
    },
    'near-testnet': {
      symbol: 'NEAR-testnet',
      decimals: 24,
      name: 'Test Near',
    },
    'arbitrum-rinkeby': {
      symbol: 'ARETH',
      decimals: 18,
      name: 'Arbitrum Testnet',
    },
    'arbitrum-one': {
      symbol: 'AETH',
      decimals: 18,
      name: 'Arbitrum Ether',
    },
    avalanche: {
      symbol: 'AVAX',
      decimals: 18,
      name: 'AVAX',
    },
    optimism: {
      symbol: 'ETH-optimism',
      decimals: 18,
      name: 'Optimism Ether',
    },
    moonbeam: {
      symbol: 'GLMR',
      decimals: 18,
      name: 'Glimmer',
    },
    tombchain: {
      symbol: 'TOMB',
      decimals: 18,
      name: 'Tomb',
    },
    mantle: {
      symbol: 'MNT',
      decimals: 18,
      name: 'Mantle',
    },
    'mantle-testnet': {
      symbol: 'MNT-testnet',
      decimals: 18,
      name: 'Mantle Testnet',
    },
    core: {
      symbol: 'CORE',
      decimals: 18,
      name: 'Core',
    },
    sepolia: {
      symbol: 'ETH-sepolia',
      decimals: 18,
      name: 'Sepolia Ether',
    },
    zksyncera: {
      symbol: 'ETH-zksync',
      decimals: 18,
      name: 'Ether',
    },
    zksynceratestnet: {
      symbol: 'ETH-zksync-testnet',
      decimals: 18,
      name: 'Ether',
    },
  },
  [RequestLogicTypes.CURRENCY.BTC]: {
    mainnet: {
      symbol: 'BTC',
      decimals: 8,
      name: 'Bitcoin',
    },
    testnet: {
      symbol: 'BTC-testnet',
      decimals: 8,
      name: 'Test Bitcoin',
    },
  },
};

/**
 * Returns a list of supported native tokens
 *
 * @returns List of supported native tokens
 */
export function getSupportedNativeCurrencies(): NativeCurrencyInput[] {
  return Object.entries(nativeCurrencies).reduce(
    (acc: NativeCurrencyInput[], [CurrencyType, supportedCurrencies]) =>
      acc.concat(
        Object.entries(supportedCurrencies).map(
          ([networkName, token]) =>
            ({
              type: CurrencyType,
              network: networkName,
              decimals: token.decimals,
              symbol: token.symbol,
            }) as NativeCurrencyInput,
        ),
      ),
    [],
  );
}
