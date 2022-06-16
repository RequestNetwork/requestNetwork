import { TokenMap } from './types';

// List of the supported Goerli ERC20 tokens
export const supportedGoerliERC20: TokenMap = {
  // Request Goerli Test Token, used for testing on goerli.
  '0x7af963cf6d228e564e2a0aa0ddbf06210b38615d': {
    decimals: 18,
    name: 'Goerli Test Token',
    symbol: 'TST',
  },
  // Faucet Token on Goerli network. Easy to use on tests.
  '0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc': {
    decimals: 18,
    name: 'Faucet Token',
    symbol: 'FAU',
  },
};
