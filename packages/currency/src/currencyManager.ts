import { RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
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
} from './types';

const { BTC, ERC20, ETH, ISO4217 } = RequestLogicTypes.CURRENCY;

/**
 * Handles a list of currencies and provide features to retrieve them, as well as convert to/from storage format
 */
export class CurrencyManager<TMeta = unknown> implements ICurrencyManager<TMeta> {
  private knownCurrencies: CurrencyDefinition<TMeta>[];
  private legacyTokens: LegacyTokenMap;

  /**
   *
   * @param knownCurrencies The list of currencies known by the Manager.
   * @param legacyTokens A mapping of legacy currency name or network name, in the format { "chainName": {"TOKEN": ["NEW_TOKEN","NEW_CHAIN"]}}
   */
  constructor(
    knownCurrencies: (CurrencyInput & { id?: string; meta?: TMeta })[],
    legacyTokens?: LegacyTokenMap,
  ) {
    this.knownCurrencies = knownCurrencies.map(CurrencyManager.fromInput);
    this.legacyTokens = legacyTokens || CurrencyManager.getDefaultLegacyTokens();
  }

  /**
   * Gets a supported currency from a symbol, symbol-network or address.
   *
   * @param symbolOrAddress e.g. 'DAI', 'FAU', 'FAU-rinkeby' or '0xFab46E002BbF0b4509813474841E0716E6730136'
   * @param network e.g. rinkeby, mainnet
   */
  from(symbolOrAddress: string, network?: string): CurrencyDefinition<TMeta> | undefined {
    if (utils.isAddress(symbolOrAddress)) {
      return this.fromAddress(symbolOrAddress, network);
    }
    const parts = symbolOrAddress.split('-');
    return (
      this.fromSymbol(parts[0], network || parts[1]) ||
      // try without splitting the symbol to support currencies like ETH-rinkeby
      this.fromSymbol(symbolOrAddress, network)
    );
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
    symbol = symbol.toUpperCase();
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
   * Adds computed parameters to a CurrencyInput
   */
  static fromInput<TMeta = unknown>({
    id,
    hash,
    meta,
    ...input
  }: CurrencyInput & { id?: string; hash?: string; meta?: TMeta }): CurrencyDefinition<TMeta> {
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
