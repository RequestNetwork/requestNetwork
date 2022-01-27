import { CurrencyManager, CurrencyInput, CurrencyPairs } from '@requestnetwork/currency';
import axios from 'axios';
import { RequestLogicTypes } from '@requestnetwork/types';

type Proxy = {
  pair: string;
  deviationThreshold: number;
  heartbeat: string;
  decimals: number;
  proxy: string;
};
type Network = {
  name: string;
  url: string;
  proxies: Proxy[];
};

type Feed = {
  title: string;
  networks: Network[];
};
export type Aggregator = {
  name: string;
  input: string;
  output: string;
  aggregator: string;
};

const feedMap: Record<string, [chainKey: string, networkName: string]> = {
  mainnet: ['ethereum-addresses', 'Ethereum Mainnet'],
  rinkeby: ['ethereum-addresses', 'Rinkeby Testnet'],
  fantom: ['fantom-price-feeds', 'Fantom Mainnet'],
  matic: ['matic-addresses', 'Polygon Mainnet'],
};

export const getAvailableAggregators = async (
  network: string,
  cm: CurrencyManager,
  pairs?: string[],
): Promise<Aggregator[]> => {
  const [feedName, networkName] = feedMap[network] || [];
  if (!feedName || !networkName) {
    throw new Error(`network ${network} not supported`);
  }
  const { data } = await axios.get<Record<string, Feed>>(
    'https://cl-docs-addresses.web.app/addresses.json',
  );

  const mainnetProxies = data[feedName].networks.find((x) => x.name === networkName)?.proxies;
  if (!mainnetProxies) {
    throw new Error(`not proxies for feed ${feedName} > ${networkName}`);
  }
  const missingAggregators: Aggregator[] = [];
  for (const proxy of mainnetProxies) {
    const [from, to] = proxy.pair.split(' / ');
    const fromCurrency = cm.from(from);
    const toCurrency = cm.from(to);
    if (pairs && !pairs.includes(`${from}-${to}`.toLowerCase())) {
      continue;
    }
    if (
      fromCurrency?.hash &&
      toCurrency?.hash &&
      fromCurrency.type !== RequestLogicTypes.CURRENCY.BTC &&
      toCurrency.type !== RequestLogicTypes.CURRENCY.BTC &&
      (fromCurrency.type === RequestLogicTypes.CURRENCY.ISO4217 ||
        fromCurrency.network === network) &&
      !cm.getConversionPath(fromCurrency, toCurrency, network)
    ) {
      missingAggregators.push({
        name: proxy.pair,
        input: fromCurrency.hash,
        output: toCurrency.hash,
        aggregator: proxy.proxy,
      });
    }
  }
  return missingAggregators;
};

const loadCurrencyApi = async <T>(path: string): Promise<T> => {
  const client = axios.create({
    baseURL: 'https://api.request.network/currency',
  });
  const { data } = await client.get<T>(path);
  return data;
};

export const getCurrencyManager = async (list?: string): Promise<CurrencyManager> => {
  const aggregators = await loadCurrencyApi<Record<string, CurrencyPairs>>('/aggregators');
  const currencyList = list
    ? await loadCurrencyApi<CurrencyInput[]>(`/list/${list}`)
    : CurrencyManager.getDefaultList();
  return new CurrencyManager(currencyList, undefined, aggregators);
};
