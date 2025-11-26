import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported base sepolia testnet tokens
export const supportedBaseSepoliaERC20: CurrencyTypes.TokenMap = {
  // USDC on Base Sepolia
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  // Add more tokens as needed for testing on Base Sepolia
};
