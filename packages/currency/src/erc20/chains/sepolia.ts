import { TokenMap } from '../../types';

// List of the supported goerli ERC20 tokens
export const supportedSepoliaERC20: TokenMap = {
  // Faucet Token on goerli network.
  '0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C': {
    decimals: 18,
    name: 'FaucetToken',
    symbol: 'FAU',
  },
  '0xF046b3CA5ae2879c6bAcC4D42fAF363eE8379F78': {
    decimals: 18,
    name: 'FakeUSDT',
    symbol: 'fUSDT',
  },
};
