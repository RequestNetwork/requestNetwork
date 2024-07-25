import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported celo network tokens
export const supportedCeloERC20: CurrencyTypes.TokenMap = {
  // https://explorer.celo.org/address/0x765de816845861e75a25fca122bb6898b8b1282a/read_contract
  '0x765DE816845861e75A25fCA122bb6898B8B1282a': {
    // FIXME: should be cUSD, need to work on the retrocompatibility
    symbol: 'cUSD',
    decimals: 18,
    name: 'Celo Dollar',
  },
  // https://explorer.celo.org/address/0x471EcE3750Da237f93B8E339c536989b8978a438/read_contract
  '0x471EcE3750Da237f93B8E339c536989b8978a438': {
    symbol: 'cGLD',
    decimals: 18,
    name: 'Celo Gold',
  },
  // https://explorer.celo.org/address/0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73/read_contract
  '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73': {
    symbol: 'cEUR',
    decimals: 18,
    name: 'Celo Euro',
  },
};
