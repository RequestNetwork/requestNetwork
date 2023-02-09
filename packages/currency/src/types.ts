import { RequestLogicTypes } from '@requestnetwork/types';

/** Native Currency types */
export type NativeCurrencyType = RequestLogicTypes.CURRENCY.BTC | RequestLogicTypes.CURRENCY.ETH;

/**
 * A native blockchain token (ETH, MATIC, ETH-rinkeby...)
 */
export type NativeCurrency = {
  type: NativeCurrencyType;
  symbol: string;
  decimals: number;
  network: string;
};

/**
 * A Fiat currency (EUR, USD...)
 */
export type ISO4217Currency = {
  type: RequestLogicTypes.CURRENCY.ISO4217;
  symbol: string;
  decimals: number;
  network?: never;
};

/**
 * An ERC20 token (DAI, USDT...)
 */
export type ERC20Currency = {
  type: RequestLogicTypes.CURRENCY.ERC20;
  symbol: string;
  decimals: number;
  network: string;
  address: string;
};

/**
 * An ERC777 SuperToken (DAIx, USDCx...)
 */
export type ERC777Currency = {
  type: RequestLogicTypes.CURRENCY.ERC777;
  symbol: string;
  decimals: number;
  network: string;
  address: string;
};

/**
 * The minimum properties of a Currency
 */
export type CurrencyInput = NativeCurrency | ISO4217Currency | ERC20Currency | ERC777Currency;

/**
 * The description of Currency, its core properties and some computed properties.
 * `meta` enables applications to add any metadata they need to a Currency
 */
export type CurrencyDefinition<TMeta = unknown> = CurrencyInput & {
  id: string;
  hash: string;
  meta: TMeta;
};

/**
 * Alias for ICurrency for clarity in the context
 */
export type StorageCurrency = RequestLogicTypes.ICurrency;

/**
 * A Currency manager handles a list of currencies and provides utility to retrieve and change format
 */
export interface ICurrencyManager<TMeta = unknown> {
  from(symbolOrAddress: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromAddress(address: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromSymbol(symbol: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromHash(hash: string, network?: string): CurrencyDefinition<TMeta> | undefined;
  fromStorageCurrency(currency: StorageCurrency): CurrencyDefinition<TMeta> | undefined;
  getNativeCurrency(
    type: NativeCurrencyType,
    network: string,
  ): CurrencyDefinition<TMeta> | undefined;
  getConversionPath(
    from: Pick<CurrencyDefinition, 'hash'>,
    to: Pick<CurrencyDefinition, 'hash'>,
    network: string,
  ): string[] | null;
  supportsConversion(currency: Pick<CurrencyDefinition, 'hash'>, network: string): boolean;
}

/**
 * A mapping from old to new name for a given currency.
 *
 * Format  { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
 */
export type LegacyTokenMap = Record<string, Record<string, [string, string]>>;
