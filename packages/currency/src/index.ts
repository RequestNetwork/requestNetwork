import { RequestLogicTypes } from '@requestnetwork/types';
import iso4217 from './iso4217';
import othersCurrencies from './others';

import {
  getErc20Currency,
  getErc20Decimals,
  getErc20Symbol,
  getSupportedERC20Tokens,
} from './erc20';

export { validERC20Address } from './erc20';

// Simple function to get the currency from the value alone
const getCurrency = (currencyValue: string, network: string): RequestLogicTypes.ICurrency => {
  // Check if it's a supported cryptocurrency
  if (currencyValue === 'BTC') {
    return {
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'BTC',
    };
  }
  if (currencyValue === 'ETH') {
    return {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'ETH',
    };
  }

  // Check if it's an ERC20 token and return it if found
  const erc20Currency = getErc20Currency(currencyValue, network);
  if (erc20Currency) {
    return erc20Currency;
  }

  // Check if it's one of ISO4217 currencies
  if (iso4217.find((i) => i.code === currencyValue)) {
    return {
      type: RequestLogicTypes.CURRENCY.ISO4217,
      value: currencyValue,
    };
  }
  throw new Error(`The currency ${currencyValue} is not supported`);
};

/**
 * Returns a Currency object from a user-friendly currency string.
 * The string format is: [CURRENCY_NAME]-[network].
 * The network is optional.
 * E.g: BTC, ETH, ETH-rinkeby, SAI, USD, EUR
 *
 * @param currencyString The currency string to be formatted
 */
export function stringToCurrency(currencyString: string): RequestLogicTypes.ICurrency {
  // Check the string
  if (!currencyString) {
    throw new Error(`Currency string can't be empty.`);
  }

  // Split the currency string value and network (if available)
  const [value, network] = currencyString.split('-');

  const currency = getCurrency(value, network);

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
 *
 * @param currency The currency object to get the string from
 * @returns The currency string identifier
 */
export function currencyToString(currency: RequestLogicTypes.ICurrency): string {
  let symbol: string;

  switch (currency.type) {
    case RequestLogicTypes.CURRENCY.BTC:
    case RequestLogicTypes.CURRENCY.ETH:
      symbol = currency.type;
      break;
    case RequestLogicTypes.CURRENCY.ISO4217:
      symbol = currency.value;
      break;
    case RequestLogicTypes.CURRENCY.ERC20:
      symbol = getErc20Symbol(currency) || 'unknown';
      break;
    default:
      symbol = 'unknown';
  }

  // Return without network if we don't recognize the symbol
  if (symbol === 'unknown') {
    return symbol;
  }

  // If the currency have a network, append it to the currency symbol
  const network = currency.network && currency.network !== 'mainnet' ? `-${currency.network}` : '';

  return symbol + network;
}

/**
 * Returns the number of decimals for a currency
 *
 * @param currency The currency
 * @returns The number of decimals
 */
export function getDecimalsForCurrency(currency: RequestLogicTypes.ICurrency): number {
  // Return decimals if currency is an ERC20
  if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
    return getErc20Decimals(currency);
  }

  // Return the number of decimals for ISO-4217 currencies
  if (currency.type === RequestLogicTypes.CURRENCY.ISO4217) {
    const iso = iso4217.find((i) => i.code === currency.value);
    if (!iso) {
      throw new Error(`Unsupported ISO currency ${currency.value}`);
    }
    return iso.digits;
  }

  // other currencies
  const otherCurrency = othersCurrencies[currency.type];
  if (!otherCurrency) {
    throw new Error(`Currency ${currency.type} not implemented`);
  }

  return otherCurrency.decimals;
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

export default {
  currencyToString,
  getAllSupportedCurrencies,
  getDecimalsForCurrency,
  stringToCurrency,
};
