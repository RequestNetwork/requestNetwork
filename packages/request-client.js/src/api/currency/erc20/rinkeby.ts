import { RequestLogicTypes } from '@requestnetwork/types';

// List of the supported rinkeby ERC20 tokens
export const supportedRinkebyERC20 = new Map([
  // Request Central Bank token, used for testing on rinkeby.
  [
    'CTBK',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
    },
  ],

  // Faucet Token on rinkeby network. Easy to use on tests.
  [
    'FAU',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0xFab46E002BbF0b4509813474841E0716E6730136',
    },
  ],
]);

// Additional details about the supported rinkeby ERC20 tokens.
export const supportedRinkebyERC20Details = {
  // Request Central Bank token, used for testing on rinkeby.
  CTBK: {
    // Faucet URL: https://central.request.network
    address: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
    decimals: 18,
    name: 'Central Bank Token',
  },
  // Faucet Token on rinkeby network.
  FAU: {
    // Faucet URL: https://erc20faucet.com/
    address: '0xFab46E002BbF0b4509813474841E0716E6730136',
    decimals: 18,
    name: 'Faucet Token',
  },
};
