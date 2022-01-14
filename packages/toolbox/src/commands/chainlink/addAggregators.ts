import axios from 'axios';
import * as yargs from 'yargs';
import inquirer from 'inquirer';
import { GraphQLClient, gql } from 'graphql-request';
import { CurrencyManager } from '@requestnetwork/currency';
import { runUpdate } from './utils';

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
type Aggregator = {
  name: string;
  input: string;
  output: string;
  aggregator: string;
};

type Options = {
  dryRun: boolean;
  network: string;
  privateKey?: string;
  mnemonic?: string;
  pair?: string[];
  list?: string;
};

export const command = 'addAggregators <network>';
export const describe = 'loads all known aggregators and adds missing';
export const builder = (): yargs.Argv<Options> =>
  yargs.options({
    dryRun: {
      type: 'boolean',
      default: false,
    },
    network: {
      type: 'string',
      demandOption: true,
    },
    pair: {
      array: true,
      type: 'string',
      describe: 'The pairs to add. Eg.  "--pair req-usd --pair eth-usd"',
    },
    mnemonic: {
      type: 'string',
    },
    privateKey: {
      type: 'string',
      describe: 'Takes precedence over mnemonic',
    },
    list: {
      type: 'string',
      describe:
        'If specified, limits aggregators to currencies existing in the given list. The list NAME must be available at https://api.request.network/currency/list/NAME',
    },
  });

const feedMap: Record<string, [string, string]> = {
  mainnet: ['ethereum-addresses', 'Ethereum Mainnet'],
  rinkeby: ['ethereum-addresses', 'Rinkeby Testnet'],
  fantom: ['fantom-price-feeds', 'Fantom Mainnet'],
};

const getExistingAggregators = async (network: string) => {
  const client = new GraphQLClient(
    `https://api.thegraph.com/subgraphs/name/requestnetwork/price-aggregators-${network}`,
  );
  const { aggregators } = await client.request<{
    aggregators: { input: string }[];
  }>(
    gql`
      {
        aggregators {
          input
        }
      }
    `,
  );
  return aggregators;
};

const getAvailableAggregators = async (network: string, pairs?: string[]) => {
  const [feedName, networkName] = feedMap[network] || [];
  if (!feedName || !networkName) {
    throw new Error(`network ${network} not supported`);
  }
  const { data } = await axios.get<Record<string, Feed>>(
    'https://cl-docs-addresses.web.app/addresses.json',
  );
  const cm = CurrencyManager.getDefault();
  const defaultPairs = CurrencyManager.getDefaultConversionPairs();
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
      !defaultPairs.mainnet[fromCurrency.hash]?.[toCurrency.hash]
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

const pickAggregators = async (aggregators: Aggregator[], pairs?: string[]) => {
  if (!pairs || pairs.length !== aggregators.length) {
    const { list } = await inquirer.prompt<{ list: typeof aggregators }>([
      {
        name: 'list',
        message: 'Choose aggregators to update',
        type: 'checkbox',
        loop: false,
        pageSize: 10,
        choices: aggregators.map((x) => ({ checked: true, name: x.name, value: x })),
      },
    ]);
    return list;
  }
  return aggregators;
};

const filterCurrencies = async (list: string, aggregators: Aggregator[]) => {
  const { data } = await axios.get<{ hash: string }[]>(
    `https://api.request.network/currency/list/${list}`,
  );
  const toKeep = data.map((x) => x.hash);
  return aggregators.filter((x) => toKeep.includes(x.input));
};

export const handler = async (args: Options): Promise<void> => {
  const { network, pair } = args;
  const pairs = pair?.map((x) => x.toLowerCase().trim());

  const availableAggregators = await getAvailableAggregators(network, pairs);
  if (availableAggregators.length === 0) {
    console.log('no available aggregators');
    return;
  }
  const existingAggregators = await getExistingAggregators(network);
  const missingAggregators = availableAggregators.filter(
    (av) => !existingAggregators.find((ex) => ex.input === av.input),
  );

  let filteredAggregators = missingAggregators;

  if (args.list) {
    filteredAggregators = await filterCurrencies(args.list, filteredAggregators);
  }
  filteredAggregators = await pickAggregators(filteredAggregators, pairs);

  if (filteredAggregators.length === 0) {
    console.log('no results after filtering existing aggregators');
    return;
  } else if (filteredAggregators.length === 1) {
    const aggregator = filteredAggregators[0];

    await runUpdate(
      'updateAggregator',
      [aggregator.input, aggregator.output, aggregator.aggregator],
      args,
    );
  } else {
    await runUpdate(
      'updateAggregatorsList',
      [
        filteredAggregators.map((x) => x.input),
        filteredAggregators.map((x) => x.output),
        filteredAggregators.map((x) => x.aggregator),
      ],
      args,
    );
  }
};
