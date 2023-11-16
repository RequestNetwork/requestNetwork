import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported goerli ERC20 tokens
export const supportedGoerliERC20: CurrencyTypes.TokenMap = {
  // Faucet Token on goerli network.
  '0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc': {
    decimals: 18,
    name: 'FaucetToken',
    symbol: 'FAU',
  },
};
