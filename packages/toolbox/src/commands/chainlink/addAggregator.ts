import * as yargs from 'yargs';
import { runUpdate } from './contractUtils';
import { getAllAggregators, getCurrencyManager } from './aggregatorsUtils';
import assert from 'assert';
import { EvmChains } from '@requestnetwork/currency';

type Options = {
  dryRun: boolean;
  network: string;
  privateKey?: string;
  mnemonic?: string;
  input: string;
  output: string;
  aggregator?: string;
  list?: string;
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
      describe: 'The token hash, or symbol, to use as input',
    },
    output: {
      type: 'string',
      demandOption: true,
      describe: 'The token hash, or symbol, to use as output',
    },
    aggregator: {
      type: 'string',
      describe:
        'The address of the aggregation contract, or its name on ChainLink docs. eg. "USDC / USD". If omitted, will default to "input / output"',
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
        'Required when passing symbols in input or output. The list NAME must be available at https://api.request.network/currency/list/NAME',
    },
  });

export const handler = async (args: Options): Promise<void> => {
  let { input, output, aggregator } = args;
  const { network, list } = args;

  const currencyManager = await getCurrencyManager(list);

  EvmChains.assertChainSupported(network);
  const inputCcy = currencyManager.from(input, network) || currencyManager.from(input);
  const outputCcy = currencyManager.from(output, network) || currencyManager.from(output);

  if (!input.startsWith('0x')) {
    assert(inputCcy, `input ${input} not found`);
    input = inputCcy.hash;
  }
  if (!output.startsWith('0x')) {
    assert(outputCcy, `output ${output} not found`);
    output = outputCcy.hash;
  }
  if (!aggregator) {
    aggregator = `${inputCcy?.symbol} / ${outputCcy?.symbol}`;
  }
  if (!aggregator.startsWith('0x')) {
    const aggregators = await getAllAggregators(network);
    const newAggregator = aggregators.find((x) => x.name === aggregator);
    assert(newAggregator, `aggregator ${aggregator} not found`);
    aggregator = newAggregator?.proxyAddress;
  }
  assert(aggregator);
  await runUpdate('updateAggregator', [input, output, aggregator], args);
};
