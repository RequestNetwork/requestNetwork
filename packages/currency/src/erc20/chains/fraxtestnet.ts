import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported bsc network tokens
export const supportedFraxtestneterc20: CurrencyTypes.TokenMap = {
  '0x4d15EA9C2573ADDAeD814e48C148b5262694646A': {
    name: 'FRAX USDT Token',
    symbol: 'USDT',
    decimals: 6,
  },
  '0xfc00000000000000000000000000000000000001': {
    name: 'FRAX Token',
    symbol: 'FRAX',
    decimals: 18,
  },
};
