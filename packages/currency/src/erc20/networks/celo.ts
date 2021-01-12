import { RequestLogicTypes } from '@requestnetwork/types';

// List of the supported celo network tokens
export const supportedCeloERC20 = new Map([
  // cUSD token (https://explorer.celo.org/address/0x765de816845861e75a25fca122bb6898b8b1282a/transactions)
  [
    'CUSD',
    {
      network: 'celo',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    },
  ],
]);

// Additional details about the supported rinkeby ERC20 tokens.
export const supportedCeloERC20Details = {
  // Request Central Bank token, used for testing on rinkeby.
  CUSD: {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    decimals: 18,
    name: 'Celo Dollar',
  },
};
