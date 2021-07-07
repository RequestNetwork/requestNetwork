import { RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as ethers from 'ethers';
import { getAllSupportedCurrencies } from './getAllSupportedCurrencies';
import { getSupportedERC20Currencies, getErc20Symbol, getErc20Decimals } from './erc20';
import iso4217 from './iso4217';
import { nativeCurrencies } from './native';

/**
 * @class Currency implements ICurrency with helpers
 * Represents a currency supported by the Request Logic, with minimum required
 * information: value, type and network (optional).
 */
export class Currency implements RequestLogicTypes.ICurrency {
  public readonly value: string;
  public readonly type: RequestLogicTypes.CURRENCY;
  public readonly network?: string;

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
    if (!symbolOrAddress) {
      throw new Error(`Cannot guess currency from empty string.`);
    }
    if (ethers.utils.isAddress(symbolOrAddress)) {
      const erc20Currencies = getSupportedERC20Currencies();
      const currencyFromAddress = erc20Currencies.find(
        (c) => c.value.toLowerCase() === symbolOrAddress.toLowerCase(),
      );
      if (!currencyFromAddress) {
        throw new Error(`The address ${symbolOrAddress} does not exist or is not supported`);
      }
      return new Currency(currencyFromAddress);
    }

    const currencyFromSymbol = this.fromSymbol(
      symbolOrAddress.split('-')[0],
      symbolOrAddress.split('-')[1],
    );
    return currencyFromSymbol;
  }

  /**
   * Get currency from its symbol and network.
   * @param symbol
   * @param network
   * @returns RequestLogicTypes.ICurrency
   */
  static fromSymbol = (symbol: string, network?: string): Currency => {
    if (!symbol) {
      throw new Error(`Cannot guess currency from empty symbol.`);
    }
    for (const [type, currencies] of Object.entries(getAllSupportedCurrencies())) {
      const currency = currencies.find(
        (cur) =>
          cur.symbol.toLowerCase() === symbol.toLowerCase() &&
          (!network || network === cur.network),
      );

      if (currency) {
        return new Currency({
          type: type as RequestLogicTypes.CURRENCY,
          value: currency.address || currency.symbol,
          network: currency.network,
        });
      }
    }

    throw new Error(
      `The currency symbol '${symbol}'${
        network ? ` on ${network}` : ''
      } is unknown or not supported`,
    );
  };

  /**
   * @returns Symbol if known (FAU, DAI, ETH etc.)
   */
  public getSymbol(): string | 'unknown' {
    let symbol: string;

    switch (this.type) {
      case RequestLogicTypes.CURRENCY.BTC:
      case RequestLogicTypes.CURRENCY.ETH:
        symbol = this.type;
        break;
      case RequestLogicTypes.CURRENCY.ISO4217:
        symbol = this.value;
        break;
      case RequestLogicTypes.CURRENCY.ERC20:
        symbol = getErc20Symbol(this) || 'unknown';
        break;
      default:
        symbol = 'unknown';
    }
    return symbol;
  }

  /**
   * Gets the hash of a currency
   *
   * @returns the hash of the currency
   * @todo It onlys supports Ethereum-based currencies, fiat and BTC.
   */
  public getHash(): string {
    if (this.type === RequestLogicTypes.CURRENCY.ERC20) {
      return this.value;
    }
    if (
      this.type === RequestLogicTypes.CURRENCY.ETH ||
      this.type === RequestLogicTypes.CURRENCY.BTC
    ) {
      // ignore the network
      return Utils.crypto.last20bytesOfNormalizedKeccak256Hash({
        type: this.type,
        value: this.value,
      });
    }
    return Utils.crypto.last20bytesOfNormalizedKeccak256Hash(this);
  }

  /**
   * Returns the number of decimals
   */
  public getDecimals(): number {
    // Return decimals if currency is an ERC20
    if (this.type === RequestLogicTypes.CURRENCY.ERC20) {
      return getErc20Decimals(this);
    }

    // Return the number of decimals for ISO-4217 currencies
    if (this.type === RequestLogicTypes.CURRENCY.ISO4217) {
      const iso = iso4217.find((i) => i.code === this.value);
      if (!iso) {
        throw new Error(`Unsupported ISO currency ${this.value}`);
      }
      return iso.digits;
    }

    // other currencies
    const otherCurrency = nativeCurrencies[this.type]?.find((x) => x.symbol === this.value);
    if (!otherCurrency) {
      throw new Error(`Currency ${this.type} - ${this.value} not implemented`);
    }

    return otherCurrency.decimals;
  }

  /**
   * @returns e.g.: 'ETH',  'ETH-rinkeby', 'FAU-rinkeby' etc.
   */
  public toString(): string | 'unknown' {
    const symbol = this.getSymbol();

    // Append currency network if relevant
    const network =
      this.network && this.network !== 'mainnet' && symbol !== 'unknown' ? `-${this.network}` : '';

    return symbol + network;
  }
}
