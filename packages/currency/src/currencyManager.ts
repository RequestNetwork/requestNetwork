import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import addressValidator from 'multicoin-address-validator';
import { getSupportedERC20Tokens } from './erc20';
import { getSupportedERC777Tokens } from './erc777';
import { getHash } from './getHash';
import iso4217 from './iso4217';
import { nativeCurrencies } from './native';
import { defaultConversionPairs, getPath } from './conversion-aggregators';
import { isValidNearAddress } from './currency-utils';
import { NearChains } from './chains';

const { BTC, ERC20, ERC777, ETH, ISO4217 } = RequestLogicTypes.CURRENCY;

/**
 * Handles a list of currencies and provide features to retrieve them, as well as convert to/from storage format
 */
export class CurrencyManager<TMeta = unknown> implements CurrencyTypes.ICurrencyManager<TMeta> {
  private readonly knownCurrencies: CurrencyTypes.CurrencyDefinition<TMeta>[];
  private readonly legacyTokens: CurrencyTypes.LegacyTokenMap;
  private readonly conversionPairs: CurrencyTypes.AggregatorsMap;

  /**
   *
   * @param inputCurrencies The list of currencies known by the Manager.
   * @param legacyTokens A mapping of legacy currency name or network name, in the format { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
   * @param conversionPairs A mapping of possible conversions by network (network => currencyFrom => currencyTo => cost)
   */
  constructor(
    inputCurrencies: (CurrencyTypes.CurrencyInput & { id?: string; meta?: TMeta })[],
    legacyTokens?: CurrencyTypes.LegacyTokenMap,
    conversionPairs?: CurrencyTypes.AggregatorsMap,
  ) {
    this.knownCurrencies = [];
    for (const input of inputCurrencies) {
      const currency = CurrencyManager.fromInput(input);
      if (this.knownCurrencies.some((x) => x.id === currency.id)) {
        throw new Error(`Duplicate found: ${currency.id}`);
      }
      this.knownCurrencies.push(currency);
    }
    this.legacyTokens = legacyTokens || CurrencyManager.getDefaultLegacyTokens();
    this.conversionPairs = conversionPairs || CurrencyManager.getDefaultConversionPairs();
  }

  /**
   * Gets a supported currency from a symbol, symbol-network, currency definition id or address.
   *
   * @param currencyIdentifier e.g. 'DAI', 'FAU', 'FAU-rinkeby', 'ETH-rinkeby-rinkeby' or '0xFab46E002BbF0b4509813474841E0716E6730136'
   * @param network e.g. rinkeby, mainnet
   */
  from(
    currencyIdentifier: string | undefined,
    network?: CurrencyTypes.ChainName,
  ): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
    if (!currencyIdentifier) {
      return;
    }
    if (utils.isAddress(currencyIdentifier)) {
      return this.fromAddress(currencyIdentifier, network);
    }

    const parts = currencyIdentifier.split('-');
    const currencyFromSymbol =
      this.fromSymbol(parts[0], network || (parts[1] as CurrencyTypes.ChainName)) ||
      // try without splitting the symbol to support currencies like ETH-rinkeby
      this.fromSymbol(currencyIdentifier, network);

    if (currencyFromSymbol) {
      return currencyFromSymbol;
    }

    return this.fromId(currencyIdentifier);
  }

  /**
   * Gets a supported currency from its CurrencyTypes.CurrencyDefinition id
   */
  fromId(id: string): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find((knownCurrency) => knownCurrency.id === id);
  }

  /**
   * Gets a supported currency from its address and network.
   * If more than one currency are found, undefined is returned
   */
  fromAddress(
    address: string,
    network?: string,
  ): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
    address = utils.getAddress(address);
    const matches = this.knownCurrencies.filter(
      (x) =>
        (x.type === ERC20 || x.type === ERC777) &&
        x.address === address &&
        (!network || x.network === network),
    );
    if (matches.length > 1) {
      const networks = matches.map((x) => (x as CurrencyTypes.ERC20Currency).network).join(', ');
      console.warn(
        `${address} has several matches on ${networks}. To avoid errors, specify a network.`,
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
    network?: CurrencyTypes.ChainName,
  ): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
    symbol = symbol?.toUpperCase();
    network = network?.toLowerCase() as CurrencyTypes.ChainName | undefined;

    const legacy = network ? this.legacyTokens[network]?.[symbol] : undefined;
    if (legacy) {
      [symbol, network] = legacy;
    }

    return this.knownCurrencies.find(
      (x) =>
        x.symbol.toUpperCase() === symbol &&
        ((x.type === ISO4217 && !network) || ('network' in x && x.network === network) || !network),
    );
  }

  fromHash(hash: string, network?: string): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find(
      (x) =>
        x.hash.toLowerCase() === hash.toLowerCase() &&
        ((x.type === ISO4217 && !network) || ('network' in x && x.network === network) || !network),
    );
  }
  /**
   * Retrieves a currency given its storage format (ICurrency)
   */
  fromStorageCurrency(
    currency: CurrencyTypes.StorageCurrency,
  ): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
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
          x.network === networkOrDefault) ||
          ((x.type === ETH || x.type === BTC) && x.network === networkOrDefault) ||
          (x.symbol === currency.value && !currency.network)),
    );
  }

  /**
   * Retrieves a Native currency for a type and network
   */
  getNativeCurrency(
    type: CurrencyTypes.NativeCurrencyType,
    network: string,
  ): CurrencyTypes.CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find((x) => x.type === type && x.network === network);
  }

  getConversionPath(
    from: Pick<CurrencyTypes.CurrencyDefinition, 'hash'>,
    to: Pick<CurrencyTypes.CurrencyDefinition, 'hash'>,
    network: CurrencyTypes.ChainName,
  ): string[] | null {
    try {
      return getPath(from, to, network, this.conversionPairs);
    } catch (e) {
      return null;
    }
  }

  supportsConversion(
    currency: Pick<CurrencyTypes.CurrencyDefinition, 'hash'>,
    network: CurrencyTypes.ChainName,
  ): boolean {
    return !!this.conversionPairs[network]?.[currency.hash.toLowerCase()];
  }

  /**
   * Adds computed parameters to a CurrencyTypes.CurrencyInput
   */
  static fromInput<TMeta = unknown>({
    id,
    hash,
    meta,
    ...input
  }: CurrencyTypes.CurrencyInput & {
    id?: string;
    hash?: string;
    meta?: TMeta;
  }): CurrencyTypes.CurrencyDefinition<TMeta> {
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
    };
  }

  /**
   * Utility function to compute the unique identifier
   */
  static currencyId(currency: CurrencyTypes.CurrencyInput): string {
    return 'network' in currency ? `${currency.symbol}-${currency.network}` : currency.symbol;
  }

  /**
   * Converts a currency to the storage format (ICurrency)
   */
  static toStorageCurrency(currency: CurrencyTypes.CurrencyInput): CurrencyTypes.StorageCurrency {
    return {
      type: currency.type,
      value:
        currency.type === ERC20 || currency.type === ERC777 ? currency.address : currency.symbol,
      network: currency.type === ISO4217 ? undefined : currency.network,
    };
  }

  /**
   * Validates an address for a given currency.
   * Throws if the currency is an ISO4217 currency.
   */
  validateAddress(
    address: string,
    currency: CurrencyTypes.CurrencyInput | CurrencyTypes.StorageCurrency,
  ): boolean {
    if (currency.type === RequestLogicTypes.CURRENCY.ISO4217) {
      throw new Error(`Could not validate an address for an ISO4217 currency`);
    }
    switch (currency.type) {
      case RequestLogicTypes.CURRENCY.ETH:
      case RequestLogicTypes.CURRENCY.ERC20:
      case RequestLogicTypes.CURRENCY.ERC777:
        if (NearChains.isChainSupported(currency.network)) {
          return isValidNearAddress(address, currency.network);
        } else if (currency.network === 'tron' || currency.network === 'solana') {
          return addressValidator.validate(address, currency.network);
        }
        return addressValidator.validate(address, 'ETH');
      case RequestLogicTypes.CURRENCY.BTC:
        return addressValidator.validate(
          address,
          'BTC',
          currency.network === 'testnet' ? 'testnet' : 'prod',
        );
      default:
        throw new Error(`Could not validate an address for an unknown currency type`);
    }
  }

  /**
   * Validate the correctness of a Storage Currency
   */
  validateCurrency(currency: CurrencyTypes.StorageCurrency): boolean {
    if (
      currency.type === RequestLogicTypes.CURRENCY.ISO4217 ||
      currency.type === RequestLogicTypes.CURRENCY.ETH ||
      currency.type === RequestLogicTypes.CURRENCY.BTC
    )
      return true;
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
  static getDefaultList<TMeta = unknown>(): CurrencyTypes.CurrencyDefinition<TMeta>[] {
    const isoCurrencies: CurrencyTypes.CurrencyInput[] = iso4217.map((cc) => ({
      decimals: cc.digits,
      name: cc.currency,
      symbol: cc.code,
      type: ISO4217,
    }));

    const eth: CurrencyTypes.CurrencyInput[] = nativeCurrencies.ETH.map((x) => ({
      ...x,
      type: ETH,
    }));
    const btc: CurrencyTypes.CurrencyInput[] = nativeCurrencies.BTC.map((x) => ({
      ...x,
      type: BTC,
    }));

    const erc20Tokens = getSupportedERC20Tokens();
    const erc20Currencies: CurrencyTypes.CurrencyInput[] = erc20Tokens.map((x) => ({
      ...x,
      type: ERC20,
    }));

    const erc777Tokens = getSupportedERC777Tokens();
    const erc777Currencies: CurrencyTypes.CurrencyInput[] = erc777Tokens.map((x) => ({
      ...x,
      type: ERC777,
    }));

    return isoCurrencies
      .concat(erc20Currencies)
      .concat(erc777Currencies)
      .concat(eth)
      .concat(btc)
      .map(CurrencyManager.fromInput<TMeta>);
  }

  /**
   * Returns the default list of legacy names (for symbol or network)
   */
  static getDefaultLegacyTokens(): CurrencyTypes.LegacyTokenMap {
    return {
      near: {
        NEAR: ['NEAR', 'aurora'],
      },
    };
  }

  static getDefaultConversionPairs(): CurrencyTypes.AggregatorsMap {
    return defaultConversionPairs;
  }

  /**
   * Returns a default instance of CurrencyManager based on default lists
   */
  static getDefault(): CurrencyManager {
    return new CurrencyManager(
      CurrencyManager.getDefaultList(),
      CurrencyManager.getDefaultLegacyTokens(),
    );
  }
}
