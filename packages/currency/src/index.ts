export { getSupportedERC20Tokens } from './erc20';
export { chainlinkSupportedNetworks as conversionSupportedNetworks } from './chainlink-path-aggregators';
export { getHash as getCurrencyHash } from './getHash';
export { CurrencyManager } from './currencyManager';
export * from './types';

export class UnsupportedCurrencyError extends Error {
  public symbol: string;
  public network?: string;

  constructor(symbolWithNetwork: string) {
    const [symbol, network] = symbolWithNetwork.split('-');

    super(
      `The currency symbol '${symbol}'${
        network ? ` on ${network}` : ''
      } is unknown or not supported`,
    );
    this.symbol = symbol;
    this.network = network;
  }
}
