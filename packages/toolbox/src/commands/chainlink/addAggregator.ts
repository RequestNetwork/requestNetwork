import * as yargs from 'yargs';
import { runUpdate } from './contractUtils';

type Options = {
  dryRun: boolean;
  network: string;
  privateKey?: string;
  mnemonic?: string;
  input: string;
  output: string;
  aggregator: string;
};

export const command = 'addAggregator <network>';
export const describe = 'adds a single aggregator';
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
    input: {
      type: 'string',
      demandOption: true,
    },
    output: {
      type: 'string',
      demandOption: true,
    },
    aggregator: {
      type: 'string',
      demandOption: true,
    },
    mnemonic: {
      type: 'string',
    },
    privateKey: {
      type: 'string',
      describe: 'Takes precedence over mnemonic',
    },
  });

export const handler = async (args: Options): Promise<void> => {
  const { input, output, aggregator } = args;
  await runUpdate('updateAggregator', [input, output, aggregator], args);
};
