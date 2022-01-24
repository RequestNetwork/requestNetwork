import { TokenMap } from './types';

// List of the supported arbitrum testnet ERC20 tokens
export const supportedArbitrumTestERC20: TokenMap = {
  // Faucet Token on arbitrum testnet network. Easy to use on tests.
  '0x7B91473d1Ed6Ad359132150B9CBF70452221e5E7': {
    decimals: 18,
    name: 'Arbitrum Faucet Token',
    symbol: 'ARFAU',
  },
};
