import { RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import addressValidator from 'multicoin-address-validator';
import { getSupportedERC20Tokens } from './erc20';
import { getHash } from './getHash';
import iso4217 from './iso4217';
import { nativeCurrencies } from './native';
import {
  StorageCurrency,
  CurrencyDefinition,
  CurrencyInput,
  ERC20Currency,
  ICurrencyManager,
  LegacyTokenMap,
  NativeCurrencyType,
} from './types';
import { chainlinkCurrencyPairs, CurrencyPairs, getPath } from './chainlink-path-aggregators';
import { isValidNearAddress } from './currency-utils';

const { BTC, ERC20, ETH, ISO4217 } = RequestLogicTypes.CURRENCY;

/**
 * Handles a list of currencies and provide features to retrieve them, as well as convert to/from storage format
 */
export class CurrencyManager<TMeta = unknown> implements ICurrencyManager<TMeta> {
  private readonly knownCurrencies: CurrencyDefinition<TMeta>[];
  private readonly legacyTokens: LegacyTokenMap;
  private readonly conversionPairs: Record<string, CurrencyPairs>;

  /**
   *
   * @param inputCurrencies The list of currencies known by the Manager.
   * @param legacyTokens A mapping of legacy currency name or network name, in the format { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
   */
  constructor(
    inputCurrencies: (CurrencyInput & { id?: string; meta?: TMeta })[],
    legacyTokens?: LegacyTokenMap,
    conversionPairs?: Record<string, CurrencyPairs>,
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
    network?: string,
  ): CurrencyDefinition<TMeta> | undefined {
    if (!currencyIdentifier) {
      return;
    }
    if (utils.isAddress(currencyIdentifier)) {
      return this.fromAddress(currencyIdentifier, network);
    }

    const parts = currencyIdentifier.split('-');
    const currencyFromSymbol =
      this.fromSymbol(parts[0], network || parts[1]) ||
      // try without splitting the symbol to support currencies like ETH-rinkeby
      this.fromSymbol(currencyIdentifier, network);

    if (currencyFromSymbol) {
      return currencyFromSymbol;
    }

    return this.fromId(currencyIdentifier);
  }

  /**
   * Gets a supported currency from its CurrencyDefinition id
   */
  fromId(id: string): CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find((knownCurrency) => knownCurrency.id === id);
  }

  /**
   * Gets a supported currency from its address and network.
   * If more than 1 currencies are found, undefined is returned
   */
  fromAddress(address: string, network?: string): CurrencyDefinition<TMeta> | undefined {
    address = utils.getAddress(address);
    const matches = this.knownCurrencies.filter(
      (x) => x.type === ERC20 && x.address === address && (!network || x.network === network),
    );
    if (matches.length > 1) {
      const networks = matches.map((x) => (x as ERC20Currency).network).join(', ');
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
  fromSymbol(symbol: string, network?: string): CurrencyDefinition<TMeta> | undefined {
    symbol = symbol?.toUpperCase();
    network = network?.toLowerCase();

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
        ((x.type === ERC20 && currency.value === x.address && x.network === networkOrDefault) ||
          ((x.type === ETH || x.type === BTC) && x.network === networkOrDefault) ||
          (x.symbol === currency.value && !currency.network)),
    );
  }

  /**
   * Retrieves a Native currency for a type and network
   */
  getNativeCurrency(
    type: NativeCurrencyType,
    network: string,
  ): CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find((x) => x.type === type && x.network === network);
  }

  getConversionPath(
    from: Pick<CurrencyDefinition, 'hash'>,
    to: Pick<CurrencyDefinition, 'hash'>,
    network: string,
  ): string[] | null {
    try {
      return getPath(from, to, network, this.conversionPairs);
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
  }: CurrencyInput & { id?: string; hash?: string; meta?: TMeta }): CurrencyDefinition<TMeta> {
    if ('address' in input) {
      input.address = utils.getAddress(input.address);
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
  static currencyId(currency: CurrencyInput): string {
    return 'network' in currency ? `${currency.symbol}-${currency.network}` : currency.symbol;
  }

  /**
   * Converts a currency to the storage format (ICurrency)
   */
  static toStorageCurrency(currency: CurrencyInput): StorageCurrency {
    return {
      type: currency.type,
      value: currency.type === ERC20 ? currency.address : currency.symbol,
      network: currency.type === ISO4217 ? undefined : currency.network,
    };
  }

  /**
   * Validates an address for a given currency.
   * Throws if the currency is an ISO4217 currency.
   */
  static validateAddress(address: string, currency: CurrencyInput): boolean {
    switch (currency.type) {
      case RequestLogicTypes.CURRENCY.ISO4217:
        throw new Error(`Could not validate an address for an ISO4217 currency`);
      case RequestLogicTypes.CURRENCY.ETH:
      case RequestLogicTypes.CURRENCY.ERC20:
        switch (currency.symbol) {
          case 'NEAR':
          case 'NEAR-testnet':
            return isValidNearAddress(address, currency.network);
          default:
            // we don't pass a third argument to the validate method here
            // because there is no difference between testnet and prod
            // for the ethereum validator, see:
            // https://github.com/christsim/multicoin-address-validator/blob/f8f3626f441c0d53fdc3b89678629dc1d33c0546/src/ethereum_validator.js
            return addressValidator.validate(address, 'ETH');
        }
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
   * Returns the list of currencies supported by Request out of the box
   * Contains:
   * - ISO currencies
   * - ERC20 currencies from Metamask/contract-metadata + some additional tokens
   * - ETH, & some EVM-compatible chains native tokens
   * - NEAR, YEL, ZIL, BTC
   * - ETH-rinkeby, FAU-rinkeby, CTBK-rinkeby
   */
  static getDefaultList(): CurrencyDefinition[] {
    const isoCurrencies: CurrencyInput[] = iso4217.map((cc) => ({
      decimals: cc.digits,
      name: cc.currency,
      symbol: cc.code,
      type: ISO4217,
    }));

    const eth: CurrencyInput[] = nativeCurrencies.ETH.map((x) => ({ ...x, type: ETH }));
    const btc: CurrencyInput[] = nativeCurrencies.BTC.map((x) => ({ ...x, type: BTC }));

    const erc20Tokens = getSupportedERC20Tokens();
    const erc20Currencies: CurrencyInput[] = erc20Tokens.map((x) => ({ ...x, type: ERC20 }));

    return isoCurrencies
      .concat(erc20Currencies)
      .concat(eth)
      .concat(btc)
      .map(CurrencyManager.fromInput);
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

  static getDefaultConversionPairs(): Record<string, CurrencyPairs> {
    return chainlinkCurrencyPairs;
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
