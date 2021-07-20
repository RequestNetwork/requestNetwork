import { RequestLogicTypes } from '@requestnetwork/types';

import iso4217 from './iso4217';
import { nativeCurrencies } from './native';
import { getSupportedERC20Tokens } from './erc20';

/**
 * Returns an object with all the supported currency by type
 *
 * @returns List of all supported currencies
 */
export function getAllSupportedCurrencies(): Record<
  RequestLogicTypes.CURRENCY,
  Array<{
    name: string;
    symbol: string;
    decimals: number;
    network?: string;
    address?: string;
  }>
> {
  // Creates the list of ISO currencies
  const isoCurrencies = iso4217.map((cc) => ({
    decimals: cc.digits,
    name: cc.currency,
    symbol: cc.code,
  }));

  // Gets the list of ERC20 currencies
  const erc20Currencies = getSupportedERC20Tokens();

  return {
    ...nativeCurrencies,
    [RequestLogicTypes.CURRENCY.ISO4217]: isoCurrencies,
    [RequestLogicTypes.CURRENCY.ERC20]: erc20Currencies,
  };
}
