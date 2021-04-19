import { RequestLogicTypes } from '@requestnetwork/types';
import iso4217 from './iso4217';
import othersCurrencies from './others';
import { getSupportedERC20Tokens } from './erc20';
import { Currency } from './currency';
export { Currency } from './currency';
export { Token } from './token';

export { getPath as getConversionPath } from './chainlink-path-aggregators';

/**
 * Returns a Currency object from a user-friendly currency string.
 * The string format is: [CURRENCY_NAME]-[network].
 * The network is optional.
 * E.g: BTC, ETH, ETH-rinkeby, SAI, USD, EUR
 * @deprecated use Currency.from() or Currency.fromSymbol() instead
 * @param currencyString The currency string to be formatted
 */
export function stringToCurrency(currencyString: string): RequestLogicTypes.ICurrency {
  // Check the string
  if (!currencyString) {
    throw new Error(`Currency string can't be empty.`);
  }

  // Split the currency string value and network (if available)
  const [value, network] = currencyString.split('-');

  const currency = Currency.fromSymbol(value, network) as RequestLogicTypes.ICurrency;

  // If a network was declared, add it to the currency object
  if (network) {
    if (currency.network && currency.network !== network) {
      throw new Error(
        `You can't declare a network with currency ${value}. It's only available on the network: ${currency.network} `,
      );
    }
    currency.network = network;
  }

  return currency;
}

/**
 * Converts a Currency object to a readable currency string
 * @deprecated use new Currency(currency).toString() instead.
 * @param currency The currency object to get the string from
 * @returns The currency string identifier
 */
export function currencyToString(currency: RequestLogicTypes.ICurrency): string {
  return new Currency(currency).toString();
}

/**
 * Returns the number of decimals for a currency
 *
 * @param currency The currency
 * @deprecated Use new Currency().getDecimals() instead
 * @returns The number of decimals
 */
export function getDecimalsForCurrency(currency: RequestLogicTypes.ICurrency): number {
  return new Currency(currency).getDecimals();
}

/**
 * Returns an object with all the supported currency by type
 *
 * @returns List of all supported currencies
 */
export function getAllSupportedCurrencies(): {
  [type: string]: Array<{ name: string; symbol: string; decimals: number; address?: string }>;
} {
  // Creates the list of ISO currencies
  const isoCurrencies = iso4217.map((cc) => ({
    decimals: cc.digits,
    name: cc.currency,
    symbol: cc.code,
  }));

  // Gets the list of ERC20 currencies
  const erc20Currencies = getSupportedERC20Tokens();

  return {
    [RequestLogicTypes.CURRENCY.ETH]: [
      {
        decimals: othersCurrencies.ETH.decimals,
        name: othersCurrencies.ETH.name,
        symbol: othersCurrencies.ETH.code,
      },
    ],
    [RequestLogicTypes.CURRENCY.BTC]: [
      {
        decimals: othersCurrencies.BTC.decimals,
        name: othersCurrencies.BTC.name,
        symbol: othersCurrencies.BTC.code,
      },
    ],
    [RequestLogicTypes.CURRENCY.ISO4217]: isoCurrencies,
    [RequestLogicTypes.CURRENCY.ERC20]: erc20Currencies,
  };
}

/**
 * Gets the hash of a currency
 *
 * @param currency
 *
 * @returns the hash of the currency
 * @deprecated use new Currency().getHash() instead
 */
export function getCurrencyHash(currency: RequestLogicTypes.ICurrency): string {
  return new Currency(currency).getHash();
}

export default {
  currencyToString,
  getAllSupportedCurrencies,
  getCurrencyHash,
  getDecimalsForCurrency,
  stringToCurrency,
};
