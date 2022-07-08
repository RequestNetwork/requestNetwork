import { TokenMap } from './types';

// List of the supported goerli ERC20 tokens
export const supportedGoerliERC20: TokenMap = {
  // Request Test token, used for testing on goerli.
  '0x7af963cF6D228E564e2A0aA0DdBF06210B38615D': {
    decimals: 18,
    name: 'Goerli Test Token',
    symbol: 'TST',
  },
  // Faucet Token on goerli network. Easy to use on tests.
  '0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc': {
    decimals: 18,
    name: 'Faucet Token',
    symbol: 'FAU-goerli',
  },
};
