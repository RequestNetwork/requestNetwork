import { TokenMap } from './types';

// List of the supported celo network tokens
export const supportedCeloERC20: TokenMap = {
  // cUSD token (https://explorer.celo.org/address/0x765de816845861e75a25fca122bb6898b8b1282a/transactions)
  '0x765DE816845861e75A25fCA122bb6898B8B1282a': {
    symbol: 'CUSD',
    decimals: 18,
    name: 'Celo Dollar',
  },
};
