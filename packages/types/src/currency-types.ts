import * as RequestLogicTypes from './request-logic-types';

/**
 * List of supported EVM chains
 */
export type EvmChainName =
  | 'alfajores'
  | 'arbitrum-one'
  | 'arbitrum-rinkeby'
  | 'avalanche'
  | 'bsc'
  | 'bsctest'
  | 'celo'
  | 'core'
  | 'fantom'
  | 'fuse'
  | 'goerli'
  | 'mainnet'
  | 'mantle'
  | 'mantle-testnet'
  | 'matic'
  | 'moonbeam'
  | 'mumbai'
  | 'optimism'
  | 'private'
  | 'rinkeby' // FIXME: Rinkeby is deprecated
  | 'ronin'
  | 'sokol'
  | 'tombchain'
  | 'xdai';

/**
 * List of supported BTC chains
 */
export type BtcChainName = 'mainnet' | 'testnet';

/**
 * List of supported Declarative chains
 */
export type DeclarativeChainName = 'tron' | 'solana';

/**
 * List of supported NEAR chains
 * FIXME: get rid of the wrong 'aurora' alias
 */
export type NearChainName = 'aurora' | 'aurora-testnet' | 'near' | 'near-testnet';

export type ChainName = EvmChainName | BtcChainName | NearChainName | DeclarativeChainName;

/**
 * Virtual machin chains, where payment proxy contracts can be deployed
 */
export type VMChainName = EvmChainName | NearChainName;

/**
 * Common types used in token configuration files
 */
type TokenAddress = string;
type TokenDefinition = { name: string; symbol: string; decimals: number };
export type TokenMap = Record<TokenAddress, TokenDefinition>;

/**
 * Common types used in chain configuration files
 */
export type Chain = {
  chainId: number | string;
  testnet?: boolean;
  currencies?: TokenMap;
};

/**
 * A native blockchain token (ETH, MATIC, ETH-rinkeby...)
 */
export type NativeCurrency = {
  symbol: string;
  decimals: number;
  network: ChainName;
};
type NamedCurrency = { name: string };
export type NamedNativeCurrency = NativeCurrency & NamedCurrency;

/** Native Currency types */
export type NativeCurrencyType = RequestLogicTypes.CURRENCY.BTC | RequestLogicTypes.CURRENCY.ETH;

/**
 * A Fiat currency (EUR, USD...)
 */
export type ISO4217Currency = {
  symbol: string;
  decimals: number;
};

/**
 * An ERC20 token (DAI, USDT...)
 */
export type ERC20Currency = {
  symbol: string;
  decimals: number;
  network: EvmChainName | NearChainName | DeclarativeChainName;
  address: string;
};

/**
 * An ERC777 SuperToken (DAIx, USDCx...)
 */
export type ERC777Currency = {
  symbol: string;
  decimals: number;
  network: EvmChainName;
  address: string;
};

/**
 * The minimum properties of a native Currency
 */
export type NativeCurrencyInput = {
  type: RequestLogicTypes.CURRENCY.ETH | RequestLogicTypes.CURRENCY.BTC;
} & NativeCurrency;

/**
 * The minimum properties of an ISO4217 Currency
 */
export type ISO4217CurrencyInput = {
  type: RequestLogicTypes.CURRENCY.ISO4217;
} & ISO4217Currency;

/**
 * The minimum properties of an ERC20 Currency
 */
export type ERC20CurrencyInput = {
  type: RequestLogicTypes.CURRENCY.ERC20;
} & ERC20Currency;

/**
 * The minimum properties of an ERC777 Currency
 */
export type ERC777CurrencyInput = {
  type: RequestLogicTypes.CURRENCY.ERC777;
} & ERC777Currency;

/**
 * The minimum properties of a Currency
 */
export type CurrencyInput =
  | NativeCurrencyInput
  | ISO4217CurrencyInput
  | ERC20CurrencyInput
  | ERC777CurrencyInput;

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
  validateAddress(address: string, currency: CurrencyInput | StorageCurrency): boolean;
  validateCurrency(currency: StorageCurrency): boolean;
}

/**
 * A mapping from old to new name for a given currency.
 *
 * Format  { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
 */
export type LegacyTokenMap = Record<string, Record<string, [string, ChainName]>>;

/**
 * currencyFrom => currencyTo => cost
 */
export type CurrencyPairs = Record<string, Record<string, number>>;

/**
 * Aggregators maps define pairs of currencies for which an onchain oracle exists, by network.
 *
 * Network => currencyFrom => currencyTo => cost
 */
export type AggregatorsMap<T extends ChainName = ChainName> = Partial<Record<T, CurrencyPairs>>;
