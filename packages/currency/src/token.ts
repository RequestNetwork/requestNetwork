import { RequestLogicTypes } from '@requestnetwork/types';
import { Currency } from './currency';
import { getSupportedERC20Tokens } from './erc20';

/**
 * @class Token extends Currency to reference the symbol
 */
export class Token extends Currency {
  constructor(
    public value: string,
    public type: RequestLogicTypes.CURRENCY,
    public symbol: string,
    public network?: string,
  ) {
    super({ value, type, network });
  }

  /**
   * Gets a supported currency from a symbol, symbol-network or address.
   * Iterates over all the supported networks if needed
   * @param symbolOrAddress e.g. 'DAI', 'FAU', 'FAU-rinkeby' or '0xFab46E002BbF0b4509813474841E0716E6730136'
   * @returns an ICurrency object
   */
  static from(symbolOrAddress: string): Token {
    try {
      const currencyFromSymbol = this.fromSymbol(symbolOrAddress);
      return new Token(
        currencyFromSymbol.value,
        currencyFromSymbol.type,
        symbolOrAddress,
        currencyFromSymbol.network,
      );
    } catch (e) {
      const erc20Currencies = getSupportedERC20Tokens();
      const currencyFromAddress = erc20Currencies.find((c) => c.address === symbolOrAddress);
      if (!currencyFromAddress) {
        throw new Error(`The currency ${symbolOrAddress} does not exist or is not supported`);
      }
      return new Token(
        currencyFromAddress.address,
        RequestLogicTypes.CURRENCY.ERC20,
        currencyFromAddress.symbol.split('-')[0],
        currencyFromAddress.symbol.split('-')[1] || 'mainnet',
      );
    }
  }

  /**
   * Same result as Currency.toString() but with a faster implementation because symbol is known
   */
  toString = (): string => {
    const networkSuffix = this.network && this.network !== 'mainnet' ? `-${this.network}` : '';
    return this.symbol + networkSuffix;
  };
}
