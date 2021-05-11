import { TokenMap } from './types';

// List of the supported matic network tokens
export const supportedMaticERC20: TokenMap = {
  '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': {
    name: '(PoS) Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
  '0x282d8efCe846A88B159800bd4130ad77443Fa1A1': {
    name: 'Ocean Token (PoS)',
    symbol: 'mOCEAN',
    decimals: 18,
  },
};
