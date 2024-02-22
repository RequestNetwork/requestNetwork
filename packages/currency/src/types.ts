import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

/**
 * Common types used in token configuration files
 */
type TokenAddress = string;
type TokenDefinition = { name: string; symbol: string; decimals: number; id?: string };
export type TokenMap = Record<TokenAddress, TokenDefinition>;

/** Native Currency types */
export type NativeCurrencyType = RequestLogicTypes.CURRENCY.BTC | RequestLogicTypes.CURRENCY.ETH;

/**
 * A native blockchain token (ETH, MATIC, ETH-rinkeby...)
 */
export type NativeCurrency = {
  type: NativeCurrencyType;
  symbol: string;
  decimals: number;
  network: ChainTypes.IChain;
};

/**
 * A Fiat currency (EUR, USD...)
 */
export type ISO4217Currency = {
  type: RequestLogicTypes.CURRENCY.ISO4217;
  symbol: string;
  decimals: number;
};

/**
 * An ERC20 token (DAI, USDT...)
 */
export type ERC20Currency = {
  type: RequestLogicTypes.CURRENCY.ERC20;
  symbol: string;
  decimals: number;
  network: ChainTypes.IEvmChain | ChainTypes.INearChain | ChainTypes.IDeclarativeChain;
  address: string;
};

/**
 * An ERC777 SuperToken (DAIx, USDCx...)
 */
export type ERC777Currency = {
  type: RequestLogicTypes.CURRENCY.ERC777;
  symbol: string;
  decimals: number;
  network: ChainTypes.IEvmChain;
  address: string;
};

/**
 * The minimum properties of a native Currency
 */
export type NativeCurrencyInput = Omit<NativeCurrency, 'network'> & {
  network: string;
};

/**
 * The minimum properties of an ISO4217 Currency
 */
export type ISO4217CurrencyInput = ISO4217Currency;

/**
 * The minimum properties of an ERC20 Currency
 */
export type ERC20CurrencyInput = Omit<ERC20Currency, 'network'> & {
  network: string;
};

/**
 * The minimum properties of an ERC777 Currency
 */
export type ERC777CurrencyInput = Omit<ERC777Currency, 'network'> & {
  network: string;
};

/**
 * The minimum properties of a Currency
 */
export type CurrencyInput =
  | NativeCurrencyInput
  | ISO4217CurrencyInput
  | ERC20CurrencyInput
  | ERC777CurrencyInput;

/**
 * The different representations of a currency
 */
export type Currency = NativeCurrency | ISO4217Currency | ERC20Currency | ERC777Currency;

/**
 * The description of Currency, its core properties and some computed properties.
 * `meta` enables applications to add any metadata they need to a Currency
 */
export type CurrencyDefinition<TMeta = unknown> = Currency & {
  id: string;
  hash: string;
  meta: TMeta;
};

/**
 * Allowed inputs to instantiate the CurrencyManager
 */
export type MixedCurrencyType<TMeta = unknown> =
  | (CurrencyInput & Partial<{ id?: string; hash?: string; meta?: TMeta }>)
  | CurrencyDefinition<TMeta>;

/**
 * Alias for ICurrency for clarity in the context
 */
export type StorageCurrency = RequestLogicTypes.ICurrency;

/**
 * A Currency manager handles a list of currencies and provides utility to retrieve and change format
 */
export interface ICurrencyManager<TMeta = unknown> {
  chainManager: ChainTypes.IChainManager;
  from(
    symbolOrAddress: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined;
  fromAddress(
    address: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined;
  fromSymbol(
    symbol: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined;
  fromHash(
    hash: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined;
  fromStorageCurrency(currency: StorageCurrency): CurrencyDefinition<TMeta> | undefined;
  getNativeCurrency(
    type: NativeCurrencyType,
    network: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined;
  getConversionPath(
    from: Pick<CurrencyDefinition, 'hash'>,
    to: Pick<CurrencyDefinition, 'hash'>,
    network: string | ChainTypes.IChain,
  ): string[] | null;
  supportsConversion(
    currency: Pick<CurrencyDefinition, 'hash'>,
    network: string | ChainTypes.IChain,
  ): boolean;
  validateAddress(address: string, currency: CurrencyDefinition): boolean;
  validateCurrency(currency: StorageCurrency): boolean;
}

/**
 * A mapping from old to new name for a given currency.
 *
 * Format { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
 */
export type LegacyTokenMap = Record<string, Record<string, [string, string]>>;
