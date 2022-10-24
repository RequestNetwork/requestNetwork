import { TokenMap } from './types';

// List of the supported private ERC20 tokens
export const supportedPrivateERC20: TokenMap = {
  // DAI Token on private network.
  '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35': {
    name: '(PoS) Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
};
