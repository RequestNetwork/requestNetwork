import { CurrencyTypes } from '@requestnetwork/types';

// List of the supported bsc network tokens
export const supportedMoonbeamERC20: CurrencyTypes.TokenMap = {
  '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b': {
    name: 'USDC Multichain',
    symbol: 'USDC-multichain',
    decimals: 6,
  },
  '0x931715FEE2d06333043d11F658C8CE934aC61D0c': {
    name: 'USDC Wormhole',
    symbol: 'USDC-wormhole',
    decimals: 6,
  },
};
