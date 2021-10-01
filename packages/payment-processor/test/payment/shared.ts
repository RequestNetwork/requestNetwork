import { CurrencyManager } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';

export const currencyManager = new CurrencyManager([
  ...CurrencyManager.getDefaultList(),
  ...[{
    network: 'private',
    symbol: 'ETH',
    decimals: 18,
    type: RequestLogicTypes.CURRENCY.ETH as any,
  }],
  ...[
    '0x9FBDa871d559710256a2502A2517b794B482Db40',
    '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
    '0x17b4158805772ced11225e77339f90beb5aae968',
    '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
  ].map((address, i) => ({
    address,
    network: 'private',
    decimals: 18,
    symbol: 'ERC20_' + i,
    type: RequestLogicTypes.CURRENCY.ERC20,
  })),
]);
