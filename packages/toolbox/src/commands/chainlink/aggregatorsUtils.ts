import { CurrencyManager, CurrencyInput, AggregatorsMap } from '@requestnetwork/currency';
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
  mainnet: ['ethereum', 'Ethereum Mainnet'],
  goerli: ['ethereum', 'Goerli Testnet'],
  rinkeby: ['ethereum', 'Rinkeby Testnet'],
  fantom: ['fantom', 'Fantom Mainnet'],
  matic: ['polygon', 'Polygon Mainnet'],
  xdai: ['gnosis-chain', 'Gnosis Chain Mainnet'],
  bsc: ['bnb-chain', 'BNB Chain Mainnet'],
  avalanche: ['avalanche', 'Avalanche Mainnet'],
  optimism: ['optimism', 'Optimism Mainnet'],
  'arbitrum-one': ['arbitrum', 'Arbitrum Mainnet'],
};

export const getAllAggregators = async (network: string): Promise<Proxy[]> => {
  const [feedName, networkName] = feedMap[network] || [];
  if (!feedName || !networkName) {
    throw new Error(
      `network ${network} not supported by feed provider. Is it supported by Chainlink?`,
    );
  }
  const { data } = await axios.get<Record<string, Feed>>(
    'https://cl-docs-addresses.web.app/addresses.json',
  );

  const proxies = data[feedName].networks.find((x) => x.name === networkName)?.proxies;
  if (!proxies) {
    throw new Error(`not proxies for feed ${feedName} > ${networkName}`);
  }
  return proxies;
};

export const getAvailableAggregators = async (
  network: string,
  cm: CurrencyManager,
  pairs?: string[],
  listAll?: boolean,
): Promise<Aggregator[]> => {
  const proxies = await getAllAggregators(network);

  const missingAggregators: Aggregator[] = [];
  for (const proxy of proxies) {
    const [from, to] = proxy.pair.split(' / ');
    const fromCurrency = cm.from(from, network) || cm.from(from);
    const toCurrency = cm.from(to, network) || cm.from(to);
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
      (listAll || !cm.getConversionPath(fromCurrency, toCurrency, network))
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
  const aggregators = await loadCurrencyApi<AggregatorsMap>('/aggregators');
  const currencyList = list
    ? await loadCurrencyApi<CurrencyInput[]>(`/list/${list}`)
    : CurrencyManager.getDefaultList();
  return new CurrencyManager(currencyList, undefined, aggregators);
};
