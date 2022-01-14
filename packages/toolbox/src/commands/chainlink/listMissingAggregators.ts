import * as yargs from 'yargs';
import { getAvailableAggregators, getCurrencyManager } from './aggregatorsUtils';

type Options = {
  network: string[];
  list: string;
};

export const command = 'listMissingAggregators <list>';
export const describe = 'list missing aggregators for a given currency list';
export const builder = (): yargs.Argv<Options> =>
  yargs.options({
    dryRun: {
      type: 'boolean',
      default: false,
    },
    network: {
      type: 'string',
      array: true,
      default: ['mainnet', 'matic', 'fantom'],
    },
    list: {
      type: 'string',
      demandOption: true,
      describe: 'The list NAME must be available at https://api.request.network/currency/list/NAME',
    },
  });

export const handler = async (args: Options): Promise<void> => {
  const { list } = args;
  const currencyManager = await getCurrencyManager(list);
  for (const network of args.network) {
    const available = await getAvailableAggregators(network, currencyManager);
    if (available.length > 0) {
      console.log(network);
      console.log(available.map((x) => x.name).join('\n'));
      console.log();
    }
  }
};
