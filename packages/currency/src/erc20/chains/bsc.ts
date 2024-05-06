import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported bsc network tokens
export const supportedBSCERC20: CurrencyTypes.TokenMap = {
  '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3': {
    name: 'Binance-Peg Dai Token',
    symbol: 'DAI',
    decimals: 18,
  },
  '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': {
    name: 'Binance-Peg BUSD Token',
    symbol: 'BUSD',
    decimals: 18,
  },
};
