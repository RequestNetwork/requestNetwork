import { RequestLogicTypes } from '@requestnetwork/types';

export type NativeCurrency = {
  symbol: string;
  decimals: number;
  network: string;
};

export type ISO4217Currency = {
  symbol: string;
  decimals: number;
};

export type ERC20Currency = {
  symbol: string;
  decimals: number;
  network: string;
  address: string;
};

export type CurrencyInput =
  | ({ type: RequestLogicTypes.CURRENCY.ETH | RequestLogicTypes.CURRENCY.BTC } & NativeCurrency)
  | ({ type: RequestLogicTypes.CURRENCY.ISO4217 } & ISO4217Currency)
  | ({ type: RequestLogicTypes.CURRENCY.ERC20 } & ERC20Currency);

export type CurrencyDefinition<TMeta = never> = CurrencyInput & {
  id: string;
  hash: string;
  meta: TMeta;
};

export type StorageCurrency = RequestLogicTypes.ICurrency;

export interface ICurrencyManager<TMeta = never> {
  from(symbolOrAddress: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromAddress(address: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromSymbol(symbol: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromStorageCurrency(currency: StorageCurrency): CurrencyDefinition<TMeta> | undefined;
}
