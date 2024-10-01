import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported bsc network tokens
export const supportedOptimismERC20: CurrencyTypes.TokenMap = {
  '0x7F5c764cBc14f9669B88837ca1490cCa17c31607': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58': {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
  },
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
};
