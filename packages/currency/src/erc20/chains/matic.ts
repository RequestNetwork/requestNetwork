import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported matic network tokens
export const supportedMaticERC20: CurrencyTypes.TokenMap = {
  '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': {
    name: '(PoS) Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
  '0x282d8efCe846A88B159800bd4130ad77443Fa1A1': {
    name: 'Ocean Token (PoS)',
    symbol: 'mOCEAN',
    decimals: 18,
  },
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
    name: 'USD Coin (PoS)',
    symbol: 'USDC',
    decimals: 6,
  },
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': {
    name: '(PoS) Tether USD',
    symbol: 'USDT',
    decimals: 6,
  },
  '0xD3b71117E6C1558c1553305b44988cd944e97300': {
    name: 'YEL Token',
    symbol: 'YEL',
    decimals: 18,
  },
};
