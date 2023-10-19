import { TokenMap } from '../../types.js';

// List of the supported rinkeby ERC777 tokens
export const supportedRinkebyERC777: TokenMap = {
  // Faucet Token on rinkeby network. Easy to use on tests.
  '0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90': {
    decimals: 18,
    name: 'Super fDAI Fake Token',
    symbol: 'fDAIx',
  },
};
