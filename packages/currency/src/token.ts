import { RequestLogicTypes } from '@requestnetwork/types';
import { Currency } from './currency';

/**
 * @class Token extends Currency to reference the symbol
 */
export class Token extends Currency {
  constructor(
    value: string,
    type: RequestLogicTypes.CURRENCY,
    public readonly symbol: string,
    network?: string,
  ) {
    super({ value, type, network });
  }

  /**
   * Gets a supported token from a symbol, symbol-network or address.
   * Iterates over all the supported networks if needed
   * @param symbolOrAddress e.g. 'DAI', 'FAU', 'FAU-rinkeby' or '0xFab46E002BbF0b4509813474841E0716E6730136'
   */
  static from(symbolOrAddress: string): Token {
    const currency = super.from(symbolOrAddress);
    return new Token(currency.value, currency.type, currency.getSymbol(), currency.network);
  }

  /**
   * Override for efficiency
   */
  public getSymbol(): string {
    return this.symbol;
  }

  /**
   * Same result as Currency.toString() but with a faster implementation because symbol is known
   */
  public toString(): string {
    const networkSuffix = this.network && this.network !== 'mainnet' ? `-${this.network}` : '';
    return this.symbol + networkSuffix;
  }
}
