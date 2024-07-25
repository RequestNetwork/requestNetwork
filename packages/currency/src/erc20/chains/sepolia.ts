import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported sepolia  ERC20 tokens
export const supportedSepoliaERC20: CurrencyTypes.TokenMap = {
  // Faucet Token on sepolia  network.
  '0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C': {
    decimals: 18,
    name: 'FaucetToken',
    symbol: 'FAU',
  },
  '0xF046b3CA5ae2879c6bAcC4D42fAF363eE8379F78': {
    decimals: 6,
    name: 'FakeUSDT',
    symbol: 'fUSDT',
  },
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238': {
    decimals: 6,
    name: 'FakeUSDC',
    symbol: 'fUSDC',
  },
};
