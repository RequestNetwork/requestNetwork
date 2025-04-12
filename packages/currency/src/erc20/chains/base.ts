import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported base network tokens
export const supportedBaseERC20: CurrencyTypes.TokenMap = {
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
};
