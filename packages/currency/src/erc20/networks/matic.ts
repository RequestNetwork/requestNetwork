import { RequestLogicTypes } from '@requestnetwork/types';

// List of the supported matic network tokens
export const supportedMaticERC20 = new Map([
  // mOCEAN https://explorer-mainnet.maticvigil.com/address/0x282d8efCe846A88B159800bd4130ad77443Fa1A1
  [
    'mOCEAN',
    {
      network: 'matic',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x282d8efCe846A88B159800bd4130ad77443Fa1A1',
    },
  ],
]);

export const supportedMaticERC20Details = {
  mOCEAN: {
    address: '0x282d8efCe846A88B159800bd4130ad77443Fa1A1',
    decimals: 18,
    name: 'Ocean Token (PoS)',
  },
};
