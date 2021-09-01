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

export class CurrencyManager<TMeta = unknown> implements ICurrencyManager<TMeta> {
  private knownCurrencies: CurrencyDefinition<TMeta>[];
  private legacyTokens: LegacyTokenMap;
  constructor(
    knownCurrencies: (CurrencyInput & { id?: string; meta?: TMeta })[],
    legacyTokens?: LegacyTokenMap,
  ) {
    this.knownCurrencies = knownCurrencies.map(CurrencyManager.fromInput);
    this.legacyTokens = legacyTokens || CurrencyManager.getDefaultLegacyTokens();
  }

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
        (x.type === ISO4217 || x.network === network || !network),
    );
  }

  fromStorageCurrency(currency: StorageCurrency): CurrencyDefinition<TMeta> | undefined {
    return this.knownCurrencies.find(
      (x) =>
        currency.type &&
        ((x.type === ERC20 && currency.value === x.address && x.network === currency.network) ||
          (x.symbol === currency.value && (!('network' in x) || x.network === currency.network))),
    );
  }

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

  static currencyId(currency: CurrencyInput): string {
    return 'network' in currency ? `${currency.symbol}-${currency.network}` : currency.symbol;
  }

  static toStorageCurrency(currency: CurrencyInput): StorageCurrency {
    return {
      type: currency.type,
      value: currency.type === ERC20 ? currency.address : currency.symbol,
      network: currency.type === ISO4217 ? undefined : currency.network,
    };
  }

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

  static getDefaultLegacyTokens(): LegacyTokenMap {
    return {
      near: {
        NEAR: ['NEAR', 'aurora'],
      },
    };
  }

  static getDefault(): CurrencyManager {
    return new CurrencyManager(
      CurrencyManager.getDefaultList(),
      CurrencyManager.getDefaultLegacyTokens(),
    );
  }
}
