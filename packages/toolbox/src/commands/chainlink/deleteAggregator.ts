/* eslint-disable complexity */
import * as yargs from 'yargs';
import { ethers } from 'ethers';
import { runUpdate } from './contractUtils';

type Options = {
  dryRun: boolean;
  network: string;
  privateKey?: string;
  mnemonic?: string;
  input: string;
  output: string;
};
export const command = 'deleteAggregator <network>';
export const describe = 'remove a single aggregator';
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
    mnemonic: {
      type: 'string',
    },
    privateKey: {
      type: 'string',
      describe: 'Takes precedence over mnemonic',
    },
  });

export const handler = async (args: Options): Promise<void> => {
  const { input, output } = args;

  await runUpdate('updateAggregator', [input, output, ethers.constants.AddressZero], args);
};
