import { RequestLogicTypes } from '@requestnetwork/types';
import { chainlinkCurrencyPairs } from '@requestnetwork/currency';
import { CurrencyManager } from '@requestnetwork/currency';
import iso4217 from '@requestnetwork/currency/dist/iso4217';

const getCurrency = (symbol: string) => {
  const currencyManager = CurrencyManager.getDefault();
  let currency = currencyManager.fromSymbol(symbol);
  if (!currency) {
    currency = currencyManager.from(symbol);
    if (!currency) {
      throw new Error(`Currency ${symbol} not found`);
    }
  }
  return currency;
};
const knownCurrencies = [...iso4217.map((x) => x.code), 'ETH', 'ETH-rinkeby'].reduce(
  (prev, symbol) => {
    const currency = getCurrency(symbol);

    return {
      ...prev,
      [currency.hash.toLowerCase()]: {
        value: CurrencyManager.toStorageCurrency(currency).value,
        type: currency.type,
      },
    };
  },
  {} as Record<string, { value: string; type: RequestLogicTypes.CURRENCY }>,
);
const addSupportedCurrency = (
  ccy: string,
  record: Record<RequestLogicTypes.CURRENCY, string[]>,
) => {
  const wellKnown = knownCurrencies[ccy];
  const address = wellKnown ? wellKnown.value : ccy;
  const type = wellKnown ? wellKnown.type : RequestLogicTypes.CURRENCY.ERC20;
  if (!record[type].includes(address)) {
    record[type].push(address);
  }
  record[type] = record[type].sort();
};

const generateCurrenciesWithOraclesFromAggregators = (allChainlinkPairs: Record<string, Record<string, Record<string, number>>>):
  Record<string, Record<RequestLogicTypes.CURRENCY, string[]>> => {
  const supportedCurrencies: Record<string, Record<RequestLogicTypes.CURRENCY, string[]>> = {};
  const supportedNetworks = Object.keys(chainlinkCurrencyPairs);
  // const supportedNetworks = ['private', 'rinkeby', 'mainnet', 'matic', 'fantom'];

  for (const network of supportedNetworks) {
    supportedCurrencies[network] = {
      [RequestLogicTypes.CURRENCY.ISO4217]: [],
      [RequestLogicTypes.CURRENCY.ERC20]: [],
      [RequestLogicTypes.CURRENCY.ETH]: [],
      [RequestLogicTypes.CURRENCY.BTC]: [],
    };
    for (let ccyIn in allChainlinkPairs[network]) {
      ccyIn = ccyIn.toLowerCase();
      addSupportedCurrency(ccyIn, supportedCurrencies[network]);
      for (let ccyOut in allChainlinkPairs[network][ccyIn]) {
        ccyOut = ccyOut.toLowerCase();
        addSupportedCurrency(ccyOut, supportedCurrencies[network]);
      }
    }
  }
  return supportedCurrencies;
};

export const currenciesWithConversionOracles = generateCurrenciesWithOraclesFromAggregators(chainlinkCurrencyPairs);
