import { RequestLogicTypes } from '@requestnetwork/types';
import { currencyToString } from '.';
import { getSupportedERC20Currencies, getErc20Currency } from './erc20';
import iso4217 from './iso4217';

/**
 * @class Currency implements ICurrency with helpers
 * Represents a currency supported by the Request Logic, with minimum required
 * information: value, type and network (optional).
 */
export class Currency implements RequestLogicTypes.ICurrency {
  public value: string;
  public type: RequestLogicTypes.CURRENCY;
  public network?: string;
  constructor(currency: RequestLogicTypes.ICurrency) {
    ({ value: this.value, type: this.type, network: this.network } = currency);
  }

  /**
   * Gets a supported currency from a symbol, symbol-network or address.
   * Iterates over all the supported networks if needed
   * @param symbolOrAddress e.g. 'DAI', 'FAU', 'FAU-rinkeby' or '0xFab46E002BbF0b4509813474841E0716E6730136'
   * @returns an ICurrency object
   */
  static from(symbolOrAddress: string): Currency {
    try {
      const currencyFromSymbol = this.fromSymbol(symbolOrAddress);
      return currencyFromSymbol;
    } catch (e) {
      const erc20Currencies = getSupportedERC20Currencies();
      const currencyFromAddress = erc20Currencies.find((c) => c.value === symbolOrAddress);
      if (!currencyFromAddress) {
        throw new Error(`The currency ${symbolOrAddress} does not exist or is not supported`);
      }
      return new Currency(currencyFromAddress);
    }
  }

  /**
   * Get currency from its symbol and network.
   * @param symbol
   * @param network
   * @returns RequestLogicTypes.ICurrency
   */
  static fromSymbol = (symbol: string, network?: string): Currency => {
    // Check if it's a supported cryptocurrency
    if (symbol === 'BTC') {
      return new Currency({
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      });
    }
    if (symbol === 'ETH') {
      return new Currency({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
    }

    // Check if it's an ERC20 token and return it if found
    const erc20Currency = getErc20Currency(symbol, network);
    if (erc20Currency) {
      return new Currency(erc20Currency);
    }

    // Check if it's one of ISO4217 currencies
    if (iso4217.find((i) => i.code === symbol)) {
      return new Currency({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: symbol,
      });
    }
    throw new Error(`The currency ${symbol} is not supported`);
  };

  public toString(): string {
    return currencyToString(this);
  }
}
