import { RequestLogicTypes } from '@requestnetwork/types';
import * as currencyCodes from 'currency-codes';
import { getDecimals } from './payment-network/erc20/info-retriever';

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

// TODO: replace this with a full list of supported ERC20
// List of our supported ERC20 tokens
const erc20tokensList = new Map([
  [
    'DAI',
    {
      network: 'mainnet',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    },
  ],

  [
    'FAU',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0xFab46E002BbF0b4509813474841E0716E6730136',
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
  const getCurrency = (val: string): RequestLogicTypes.ICurrency => {
    // Check if it's it's a cryptocurrency
    if (currencyList.has(val)) {
      return currencyList.get(val)!;
    }

    // Check if it's one of our supported ERC20 currencies
    // TODO: replace with actual ERC20 list
    if (erc20tokensList.has(val)) {
      return erc20tokensList.get(val)!;
    }

    // Check if it's one of ISO4217 currencies
    if (currencyCodes.codes().includes(val)) {
      return {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: val,
      };
    }
    throw new Error(`The currency ${val} is not supported`);
  };

  const currency = getCurrency(value);

  // If a network was declared, add it to the currency object
  if (network) {
    if (currency.network) {
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
  // TODO: when we create a local list of "supported ERC20", we should fetch it from the list first
  // For ERC20 currencies we have to check the decimals with the smart contract
  if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
    return getERC20Decimals(currency.value, currency.network);
  }
  // Return the number of decimals for ISO-4217 currencies
  if (currency.type === RequestLogicTypes.CURRENCY.ISO4217) {
    const iso = currencyCodes.code(currency.value);
    if (!iso) {
      throw new Error(`Unsupported ISO currency ${currency.value}`);
    }
    return iso.digits;
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

/**
 * Returns the number of decimals for an ERC20 token
 *
 * @param address The ERC20 contract address
 * @param network The ERC20 contract network
 * @returns The number of decimals
 */
async function getERC20Decimals(address: string, network: string = 'mainnet'): Promise<number> {
  return getDecimals(address, network);
}
