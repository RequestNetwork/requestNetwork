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

export type CurrencyDefinition =
  | ({ type: RequestLogicTypes.CURRENCY.ETH | RequestLogicTypes.CURRENCY.BTC } & NativeCurrency)
  | ({ type: RequestLogicTypes.CURRENCY.ISO4217 } & ISO4217Currency)
  | ({ type: RequestLogicTypes.CURRENCY.ERC20 } & ERC20Currency);

export type StorageCurrency = RequestLogicTypes.ICurrency;
