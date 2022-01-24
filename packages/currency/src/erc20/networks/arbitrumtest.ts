import { TokenMap } from './types';

// List of the supported arbitrum testnet ERC20 tokens
export const supportedArbitrumTestERC20: TokenMap = {
  // Faucet Token on arbitrum testnet network. Easy to use on tests.
  '0x7b91473d1ed6ad359132150b9cbf70452221e5e7': {
    decimals: 18,
    name: 'Arbitrum Faucet Token',
    symbol: 'ARFAU',
  },
};