import { RequestLogicTypes } from '@requestnetwork/types';
import * as currencyCodes from 'currency-codes';
import { getErc20Currency, getErc20Decimals } from './currency/erc20';

// List of our supported cryptocurrencies
const currencyList = new Map([
  [
    'BTC',
    {
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'BTC',
    },
  ],

  [
    'ETH',
    {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'ETH',
    },
  ],
]);

/**
 * Returns a Currency object from a user-friendly currency string.
 * The string format is: <CURRENCY_NAME>-<network>.
 * The network is optional.
 * E.g: BTC, ETH, ETH-rinkeby, DAI, USD, EUR
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

  // Simple function to get the currency from the value alone
  const getCurrency = (): RequestLogicTypes.ICurrency => {
    // Check if it's it's a cryptocurrency
    if (currencyList.has(value)) {
      return currencyList.get(value)!;
    }

    // Check if it's an ERC20 token and return it if found
    const erc20Currency = getErc20Currency(value, network);
    if (erc20Currency) {
      return erc20Currency;
    }

    // Check if it's one of ISO4217 currencies
    if (currencyCodes.codes().includes(value)) {
      return {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value,
      };
    }
    throw new Error(`The currency ${value} is not supported`);
  };

  const currency = getCurrency();

  // If a network was declared, add it to the currency object
  if (network) {
    if (currency.network !== network) {
      throw new Error(
        `You can't declare a network with currency ${value}. It's only available on the network: ${
          currency.network
        } `,
      );
    }
    currency.network = network;
  }

  return currency;
}

/**
 * Returns the number of decimals for a currency
 *
 * @param currency The currency
 * @returns The number of decimals
 */
export async function getDecimalsForCurrency(
  currency: RequestLogicTypes.ICurrency,
): Promise<number> {
  if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
    return getErc20Decimals(currency);
  }
  // Return the number of decimals for ISO-4217 currencies
  if (currency.type === RequestLogicTypes.CURRENCY.ISO4217) {
    const iso = currencyCodes.code(currency.value);
    if (!iso) {
      throw new Error(`Unsupported ISO currency ${currency.value}`);
    }
    return Promise.resolve(iso.digits);
  }

  const decimals = {
    [RequestLogicTypes.CURRENCY.ETH]: 18,
    [RequestLogicTypes.CURRENCY.BTC]: 8,
  }[currency.type];

  if (!decimals) {
    throw new Error(`Currency ${currency} not implemented`);
  }
  return Promise.resolve(decimals);
}
