import { AggregatorsMap, CurrencyInput, CurrencyManager } from '@requestnetwork/currency';
import axios from 'axios';
import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

type Feed = {
  name: string;
  proxyAddress: string;
};

export type Aggregator = {
  name: string;
  input: string;
  output: string;
  aggregator: string;
};

const feedMap: Partial<
  Record<CurrencyTypes.EvmChainName, [chainKey: string, networkName: string]>
> = {
  mainnet: ['mainnet', 'Ethereum Mainnet'],
  goerli: ['goerli', 'Goerli Testnet'],
  sepolia: ['sepolia', 'Sepolia Testnet'],
  fantom: ['fantom-mainnet', 'Fantom Mainnet'],
  matic: ['matic-mainnet', 'Polygon Mainnet'],
  xdai: ['xdai-mainnet', 'Gnosis Chain Mainnet'],
  bsc: ['bsc-mainnet', 'BNB Chain Mainnet'],
  avalanche: ['avalanche-mainnet', 'Avalanche Mainnet'],
  optimism: ['ethereum-mainnet-optimism-1', 'Optimism Mainnet'],
  'arbitrum-one': ['ethereum-mainnet-arbitrum-1', 'Arbitrum Mainnet'],
  moonbeam: ['polkadot-mainnet-moonbeam', 'Moonbeam Mainnet'],
};

export const getAllAggregators = async (network: CurrencyTypes.EvmChainName): Promise<Feed[]> => {
  const [feedName, networkName] = feedMap[network] || [];
  if (!feedName || !networkName) {
    throw new Error(
      `network ${network} not supported by feed provider. Is it supported by Chainlink?`,
    );
  }

  const { data: feeds } = await axios.get<Feed[]>(
    `https://reference-data-directory.vercel.app/feeds-${feedName}.json`,
  );

  if (!feeds) {
    throw new Error(`not proxies for feed ${feedName} > ${networkName}`);
  }
  return feeds;
};

export const getAvailableAggregators = async (
  network: CurrencyTypes.EvmChainName,
  cm: CurrencyManager,
  pairs?: string[],
  listAll?: boolean,
): Promise<Aggregator[]> => {
  const feeds = await getAllAggregators(network);

  const missingAggregators: Aggregator[] = [];
  for (const feed of feeds) {
    const [from, to] = feed.name.split(' / ');
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
        name: feed.name,
        input: fromCurrency.hash,
        output: toCurrency.hash,
        aggregator: feed.proxyAddress,
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
