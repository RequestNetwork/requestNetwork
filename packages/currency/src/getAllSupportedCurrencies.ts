import { RequestLogicTypes } from '@requestnetwork/types';

import { CurrencyDefinition } from './types';

/**
 * Returns an object with all the supported currency by type
 *
 * @returns List of all supported currencies
 */
export function getAllSupportedCurrencies(): Record<
  RequestLogicTypes.CURRENCY,
  Array<CurrencyDefinition>
> {
  return { BTC: [], ERC20: [], ETH: [], ISO4217: [] };
}
