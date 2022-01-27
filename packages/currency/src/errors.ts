import { RequestLogicTypes } from '@requestnetwork/types';

const getSymbolAndNetwork = (
  symbolWithNetwork: string | Omit<RequestLogicTypes.ICurrency, 'type'>,
) => {
  if (typeof symbolWithNetwork === 'string') {
    const [symbol, network] = symbolWithNetwork.split('-');
    return { symbol, network };
  }
  const { value: symbol, network } = symbolWithNetwork;
  return { symbol, network };
};

export class UnsupportedCurrencyError extends Error {
  public symbol?: string;
  public network?: string;

  constructor(symbolWithNetwork: string | Omit<RequestLogicTypes.ICurrency, 'type'>) {
    const { symbol, network } = getSymbolAndNetwork(symbolWithNetwork);
    super(
      `The currency '${symbol}'${network ? ` on ${network}` : ''} is unknown or not supported.`,
    );
    this.symbol = symbol;
    this.network = network;
  }
}
