import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported rinkeby ERC20 tokens
export const supportedRinkebyERC20: CurrencyTypes.TokenMap = {
  // Request Central Bank token, used for testing on rinkeby.
  '0x995d6A8C21F24be1Dd04E105DD0d83758343E258': {
    decimals: 18,
    name: 'Central Bank Token',
    symbol: 'CTBK',
  },
  // Faucet Token on rinkeby network. Easy to use on tests.
  '0xFab46E002BbF0b4509813474841E0716E6730136': {
    decimals: 18,
    name: 'Faucet Token',
    symbol: 'FAU',
  },
};
