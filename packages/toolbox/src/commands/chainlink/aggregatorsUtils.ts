import { AggregatorsMap, CurrencyInput, CurrencyManager } from '@requestnetwork/currency';
import { ChainTypes, RequestLogicTypes } from '@requestnetwork/types';

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

const feedMap: Partial<Record<string, [chainKey: string, networkName: string]>> = {
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

export const getAllAggregators = async (network: ChainTypes.IEvmChain): Promise<Feed[]> => {
  const [feedName, networkName] = feedMap[network.name] || [];
  if (!feedName || !networkName) {
    throw new Error(
      `network ${network} not supported by feed provider. Is it supported by Chainlink?`,
    );
  }

  const response = await fetch(
    `https://reference-data-directory.vercel.app/feeds-${feedName}.json`,
  );
  const feeds = await response.json();

  if (!feeds) {
    throw new Error(`not proxies for feed ${feedName} > ${networkName}`);
  }
  return feeds;
};

export const getAvailableAggregators = async (
  chain: ChainTypes.IEvmChain,
  cm: CurrencyManager,
  pairs?: string[],
  listAll?: boolean,
): Promise<Aggregator[]> => {
  const feeds = await getAllAggregators(chain);

  const missingAggregators: Aggregator[] = [];
  for (const feed of feeds) {
    const [from, to] = feed.name.split(' / ');
    const fromCurrency = cm.from(from, chain) || cm.from(from);
    const toCurrency = cm.from(to, chain) || cm.from(to);
    if (pairs && !pairs.includes(`${from}-${to}`.toLowerCase())) {
      continue;
    }
    if (
      fromCurrency?.hash &&
      toCurrency?.hash &&
      fromCurrency.type !== RequestLogicTypes.CURRENCY.BTC &&
      toCurrency.type !== RequestLogicTypes.CURRENCY.BTC &&
      (fromCurrency.type === RequestLogicTypes.CURRENCY.ISO4217 ||
        fromCurrency.network.eq(chain)) &&
      (listAll || !cm.getConversionPath(fromCurrency, toCurrency, chain))
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

const CURRENCY_API_URL = 'https://api.request.finance/currency';

export const getCurrencyManager = async (list?: string): Promise<CurrencyManager> => {
  const aggregators: AggregatorsMap = await fetch(`${CURRENCY_API_URL}/aggregators`).then((r) =>
    r.json(),
  );
  const currencyList: CurrencyInput[] = list
    ? await fetch(`${CURRENCY_API_URL}/list/${list}`).then((r) => r.json())
    : CurrencyManager.getDefaultList();
  return new CurrencyManager(currencyList, undefined, aggregators);
};
