import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported bsc network tokens
export const supportedAvalancheERC20: CurrencyTypes.TokenMap = {
  '0x9fB1d52596c44603198fB0aee434fac3a679f702': {
    name: 'Jarvis Synthetic Euro',
    symbol: 'jEUR',
    decimals: 18,
  },
  '0xc7198437980c041c805A1EDcbA50c1Ce5db95118': {
    name: 'Tether USD',
    symbol: 'USDTe',
    decimals: 6,
  },
  '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664': {
    name: 'USD Coin',
    symbol: 'USDCe',
    decimals: 6,
  },
  '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70': {
    name: 'Dai Stablecoin',
    symbol: 'DAIe',
    decimals: 18,
  },
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7': {
    name: 'TetherToken',
    symbol: 'USDT',
    decimals: 6,
  },
};
