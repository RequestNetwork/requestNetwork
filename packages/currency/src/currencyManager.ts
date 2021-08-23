import { RequestLogicTypes } from '@requestnetwork/types';
import { getSupportedERC20Tokens } from './erc20';
import iso4217 from './iso4217';
import { nativeCurrencies } from './native';
import { StorageCurrency, CurrencyDefinition } from './types';

const { BTC, ERC20, ETH, ISO4217 } = RequestLogicTypes.CURRENCY;

export class CurrencyManager {
  constructor(private knownCurrencies: CurrencyDefinition[]) {}

  fromSymbol(symbolAndNetwork: string | `${string}-${string}`): CurrencyDefinition | undefined {
    const [symbol, network] = symbolAndNetwork.split('-');

    return this.knownCurrencies.find(
      (x) => x.symbol === symbol && (x.type === ISO4217 || network === x.network),
    );
  }

  fromStorageCurrency(currency: StorageCurrency): CurrencyDefinition | undefined {
    return this.knownCurrencies.find(
      (x) =>
        currency.type &&
        ((x.type === ERC20 && currency.value === x.address && x.network === currency.network) ||
          (x.symbol === currency.value && (!('network' in x) || x.network === currency.network))),
    );
  }

  static toStorageCurrency(currency: CurrencyDefinition): StorageCurrency {
    return {
      type: currency.type,
      value: currency.type === ERC20 ? currency.address : currency.symbol,
      network: currency.type === ISO4217 ? undefined : currency.network,
    };
  }

  static getDefaultList(): CurrencyDefinition[] {
    const isoCurrencies: CurrencyDefinition[] = iso4217.map((cc) => ({
      decimals: cc.digits,
      name: cc.currency,
      symbol: cc.code,
      type: ISO4217,
    }));

    const eth: CurrencyDefinition[] = nativeCurrencies.ETH.map((x) => ({ ...x, type: ETH }));
    const btc: CurrencyDefinition[] = nativeCurrencies.BTC.map((x) => ({ ...x, type: BTC }));

    const erc20Tokens = getSupportedERC20Tokens();
    const erc20Currencies: CurrencyDefinition[] = erc20Tokens.map((x) => ({ ...x, type: ERC20 }));

    return isoCurrencies.concat(erc20Currencies).concat(eth).concat(btc);
  }
}
