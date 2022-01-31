import * as yargs from 'yargs';
import inquirer from 'inquirer';
import { runUpdate } from './contractUtils';
import { Aggregator, getAvailableAggregators, getCurrencyManager } from './aggregatorsUtils';

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

const pickAggregators = async (aggregators: Aggregator[], pairs?: string[]) => {
  if (!pairs || pairs.length !== aggregators.length) {
    const { list } = await inquirer.prompt<{ list: typeof aggregators }>([
      {
        name: 'list',
        message: 'Choose aggregators to update',
        type: 'checkbox',
        loop: false,
        pageSize: 50,
        choices: aggregators.map((x) => ({ checked: true, name: x.name, value: x })),
      },
    ]);
    return list;
  }
  return aggregators;
};

export const handler = async (args: Options): Promise<void> => {
  const { network, pair } = args;
  const pairs = pair?.map((x) => x.toLowerCase().trim());

  const currencyManager = await getCurrencyManager(args.list);

  const availableAggregators = await getAvailableAggregators(network, currencyManager, pairs);
  if (availableAggregators.length === 0) {
    console.log('no available aggregators');
    return;
  }
  const filteredAggregators = await pickAggregators(availableAggregators, pairs);

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
