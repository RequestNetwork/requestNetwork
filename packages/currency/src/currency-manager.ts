import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import addressValidator from 'multicoin-address-validator';
import { getSupportedERC20Currencies } from './erc20';
import { getSupportedERC777Currencies } from './erc777';
import { getHash } from './getHash';
import {
  Currency,
  CurrencyDefinition,
  CurrencyInput,
  ICurrencyManager,
  LegacyTokenMap,
  NativeCurrencyType,
  StorageCurrency,
} from './types';
import { AggregatorsMap, defaultConversionPairs, getPath } from './conversion-aggregators';
import { isValidNearAddress } from './currency-utils';
import { getSupportedNativeCurrencies } from './native';
import { ChainManager } from '@requestnetwork/chain';

const { BTC, ERC20, ERC777, ETH, ISO4217 } = RequestLogicTypes.CURRENCY;

type MixedCurrencyType<TMeta = unknown> =
  | (CurrencyInput & { id?: string; hash?: string; meta?: TMeta })
  | CurrencyDefinition<TMeta>;

/**
 * Handles a list of currencies and provide features to retrieve them, as well as convert to/from storage format
 */
export class CurrencyManager<TMeta = unknown> implements ICurrencyManager<TMeta> {
  private readonly knownCurrencies: CurrencyDefinition<TMeta>[];
  private readonly legacyTokens: LegacyTokenMap;
  private readonly conversionPairs: AggregatorsMap;
  public readonly chainManager: ChainTypes.IChainManager;

  private static defaultInstance: CurrencyManager;

  /**
   * @param inputCurrencies The list of currencies known by the Manager.
   * @param legacyTokens A mapping of legacy currency name or network name, in the format { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
   * @param conversionPairs A mapping of possible conversions by network (network => currencyFrom => currencyTo => cost)
   * @param chainManager A ChainManager instance that describes the supported underlying chains
   */
  constructor(
    inputCurrencies: MixedCurrencyType<TMeta>[],
    legacyTokens?: LegacyTokenMap,
    conversionPairs?: AggregatorsMap,
    chainManager?: ChainTypes.IChainManager,
  ) {
    this.legacyTokens = legacyTokens || CurrencyManager.getDefaultLegacyTokens();
    this.conversionPairs = conversionPairs || CurrencyManager.getDefaultConversionPairs();
    this.chainManager = chainManager || ChainManager.current();
    ChainManager.setCurrent(this.chainManager);

    // initialize currencies
    this.knownCurrencies = [];
    for (const input of inputCurrencies) {
      const currency = CurrencyManager.fromInput(input);
      if (this.knownCurrencies.some((x) => x.id === currency.id)) {
        throw new Error(`Duplicate found: ${currency.id}`);
      }
      this.knownCurrencies.push(currency);
    }
  }

  /**
   * Gets a supported currency from a symbol, symbol-network, currency definition id or address.
   *
   * @param currencyIdentifier e.g. 'DAI', 'FAU', 'FAU-rinkeby', 'ETH-rinkeby-rinkeby' or '0xFab46E002BbF0b4509813474841E0716E6730136'
   * @param network e.g. rinkeby, mainnet
   * @deprecated Use fromSymbol, fromAddress, fromId or fromHash to avoid ambiguity
   */
  from(
    currencyIdentifier: string | undefined,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined {
    if (!currencyIdentifier) {
      return;
    }
    if (utils.isAddress(currencyIdentifier)) {
      return this.fromAddress(currencyIdentifier, network);
    }

    if (network && currencyIdentifier.indexOf(ChainManager.getName(network)) === -1) {
      currencyIdentifier = CurrencyManager.currencyId({ symbol: currencyIdentifier, network });
    }

    const currencyFromId = this.fromId(currencyIdentifier);

    if (currencyFromId) {
      return currencyFromId;
    }

    const parts = currencyIdentifier.split('-');
    const currencyFromSymbol =
      this.fromSymbol(parts[0], network || parts[1]) ||
      // try without splitting the symbol to support currencies like ETH-rinkeby
      this.fromSymbol(currencyIdentifier, network);

    return currencyFromSymbol;
  }

  /**
   * Gets a supported currency from its CurrencyDefinition id
   */
  fromId(id: string): CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find((knownCurrency) => knownCurrency.id === id);
  }

  /**
   * Gets a supported currency from its address and network.
   * If more than one currency are found, undefined is returned
   */
  fromAddress(
    address: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined {
    address = utils.getAddress(address);
    const matches = this.knownCurrencies.filter(
      (x) =>
        (x.type === ERC20 || x.type === ERC777) &&
        x.address === address &&
        (!network ||
          (typeof network === 'string'
            ? x.network.name === network
            : x.network.name === network.name)),
    );
    if (matches.length > 1) {
      const networks = matches.map((x) => ('network' in x ? x.network : '')).join(', ');
      console.warn(
        `${address} has several matches on "${networks}". To avoid errors, specify a network.`,
      );
      return undefined;
    }
    return matches[0];
  }

  /**
   * Gets a supported currency from its symbol and network.
   */
  fromSymbol(
    symbol: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined {
    symbol = symbol?.toUpperCase();
    const legacy = network ? this.legacyTokens[ChainManager.getName(network)]?.[symbol] : undefined;
    if (legacy) {
      [symbol, network] = legacy;
    }

    return this.knownCurrencies.find(
      (x) =>
        x.symbol.toUpperCase() === symbol &&
        (!network || ('network' in x && x.network.name === ChainManager.getName(network))) &&
        (!network ||
          typeof network === 'string' ||
          this.chainManager.ecosystems[network.ecosystem].currencyTypes.includes(x.type)),
    );
  }

  fromHash(
    hash: string,
    network?: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find(
      (x) =>
        x.hash.toLowerCase() === hash.toLowerCase() &&
        (!network || ('network' in x && x.network.name === ChainManager.getName(network))) &&
        (!network ||
          typeof network === 'string' ||
          this.chainManager.ecosystems[network.ecosystem].currencyTypes.includes(x.type)),
    );
  }

  /**
   * Retrieves a currency given its storage format (ICurrency)
   */
  fromStorageCurrency(currency: StorageCurrency): CurrencyDefinition<TMeta> | undefined {
    if (!currency) {
      return;
    }
    if (!currency.type) {
      throw new Error('Invalid format');
    }
    const networkOrDefault = currency.network || 'mainnet';
    return this.knownCurrencies.find(
      (x) =>
        x.type === currency.type &&
        (((x.type === ERC20 || x.type === ERC777) &&
          currency.value === x.address &&
          x.network.name === networkOrDefault) ||
          ((x.type === ETH || x.type === BTC) && x.network.name === networkOrDefault) ||
          (x.symbol === currency.value && !currency.network)),
    );
  }

  /**
   * Retrieves a Native currency for a type and network
   */
  getNativeCurrency(
    type: NativeCurrencyType,
    network: string | ChainTypes.IChain,
  ): CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find(
      (x) => x.type === type && x.network.name === ChainManager.getName(network),
    );
  }

  getConversionPath(
    from: Pick<CurrencyDefinition, 'hash'>,
    to: Pick<CurrencyDefinition, 'hash'>,
    network: string | ChainTypes.IChain,
  ): string[] | null {
    try {
      return getPath(from, to, ChainManager.getName(network), this.conversionPairs);
    } catch (e) {
      return null;
    }
  }

  supportsConversion(currency: Pick<CurrencyDefinition, 'hash'>, network: string): boolean {
    return !!this.conversionPairs[network]?.[currency.hash.toLowerCase()];
  }

  /**
   * Adds computed parameters to a CurrencyInput
   */
  static fromInput<TMeta = unknown>({
    id,
    hash,
    meta,
    ...input
  }: MixedCurrencyType<TMeta>): CurrencyDefinition<TMeta> {
    if ('address' in input) {
      if (input.address.startsWith('0x') && input.address.length === 42) {
        input.address = utils.getAddress(input.address);
      }
    }
    return {
      id: id || CurrencyManager.currencyId(input),
      hash: hash || getHash(CurrencyManager.toStorageCurrency(input)),
      meta: meta as TMeta,
      ...input,
      network:
        'network' in input
          ? typeof input.network === 'string'
            ? ChainManager.current().fromName(
                input.network,
                ChainManager.current().getEcosystemsByCurrencyType(input.type),
              )
            : input.network
          : undefined,
    } as CurrencyDefinition<TMeta>;
  }

  /**
   * Utility function to compute the unique identifier
   */
  static currencyId(currency: { symbol: string; network?: string | ChainTypes.IChain }): string {
    return currency.network
      ? `${currency.symbol}-${ChainManager.getName(currency.network)}`
      : currency.symbol;
  }

  /**
   * Converts a currency to the storage format (ICurrency)
   */
  static toStorageCurrency(currency: CurrencyInput | Currency): StorageCurrency {
    return {
      type: currency.type,
      value:
        currency.type === ERC20 || currency.type === ERC777 ? currency.address : currency.symbol,
      network:
        currency.type === ISO4217
          ? undefined
          : typeof currency.network === 'string'
          ? currency.network
          : currency.network.name,
    };
  }

  /**
   * Validates an address for a given currency.
   * Throws if the currency is an ISO4217 currency.
   */
  validateAddress(address: string, currency: CurrencyDefinition | StorageCurrency): boolean {
    if (currency.type === RequestLogicTypes.CURRENCY.ISO4217) {
      throw new Error(`Could not validate an address for an ISO4217 currency`);
    }
    const chainName =
      currency.network &&
      (typeof currency.network === 'string' ? currency.network : currency.network.name);
    switch (currency.type) {
      case RequestLogicTypes.CURRENCY.ETH:
      case RequestLogicTypes.CURRENCY.ERC20:
      case RequestLogicTypes.CURRENCY.ERC777:
        if (this.chainManager.ecosystems[ChainTypes.ECOSYSTEM.NEAR].isChainSupported(chainName)) {
          return isValidNearAddress(address, chainName);
        } else if (chainName === 'tron' || chainName === 'solana') {
          return addressValidator.validate(address, chainName);
        }
        return addressValidator.validate(address, 'ETH');
      case RequestLogicTypes.CURRENCY.BTC:
        return addressValidator.validate(
          address,
          'BTC',
          chainName === 'testnet' ? 'testnet' : 'prod',
        );
      default:
        throw new Error(`Could not validate an address for an unknown currency type`);
    }
  }

  /**
   * Validate the correctness of a Storage Currency
   */
  validateCurrency(currency: StorageCurrency): boolean {
    if (
      currency.type === RequestLogicTypes.CURRENCY.ISO4217 ||
      currency.type === RequestLogicTypes.CURRENCY.ETH ||
      currency.type === RequestLogicTypes.CURRENCY.BTC
    ) {
      return true;
    }
    return this.validateAddress(currency.value, currency);
  }

  /**
   * Returns the list of currencies supported by Request out of the box
   * Contains:
   * - ISO currencies
   * - ERC20 currencies from Metamask/contract-metadata + some additional tokens
   * - ERC777 SuperTokens managed by SuperFluid
   * - ETH, & some EVM-compatible chains native tokens
   * - NEAR, YEL, ZIL, BTC
   * - ETH-rinkeby, FAU-rinkeby, CTBK-rinkeby
   */
  static getDefaultList<TMeta = unknown>(): CurrencyDefinition<TMeta>[] {
    return ([] as CurrencyInput[])
      .concat(getSupportedNativeCurrencies())
      .concat(getSupportedERC20Currencies())
      .concat(getSupportedERC777Currencies())
      .map(CurrencyManager.fromInput<TMeta>);
  }

  /**
   * Returns the default list of legacy names (for symbol or network)
   */
  static getDefaultLegacyTokens(): LegacyTokenMap {
    return {
      near: {
        NEAR: ['NEAR', 'aurora'],
      },
    };
  }

  static getDefaultConversionPairs(): AggregatorsMap {
    return defaultConversionPairs;
  }

  /**
   * Returns a default instance of CurrencyManager based on default lists
   */
  static getDefault(): CurrencyManager {
    if (this.defaultInstance) {
      return this.defaultInstance;
    }

    this.defaultInstance = new CurrencyManager(
      CurrencyManager.getDefaultList(),
      CurrencyManager.getDefaultLegacyTokens(),
    );
    return this.defaultInstance;
  }
}
