import * as yargs from 'yargs';
import { runUpdate } from './contractUtils';
import { getAllAggregators, getCurrencyManager } from './aggregatorsUtils';
import assert from 'assert';
import { ChainTypes } from '@requestnetwork/types';

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
  const { input, output, aggregator: aggregatorArg } = args;
  const { network: chainName, list } = args;

  const currencyManager = await getCurrencyManager(list);
  const chain = currencyManager.chainManager.fromName(chainName, [ChainTypes.ECOSYSTEM.EVM]);
  const inputCcy = currencyManager.from(input, chain) || currencyManager.from(input);
  const outputCcy = currencyManager.from(output, chain) || currencyManager.from(output);

  let inputAddress = input;
  if (!inputAddress.startsWith('0x')) {
    assert(inputCcy, `input ${input} not found`);
    inputAddress = inputCcy.hash;
  }

  let outputAddress = output;
  if (!outputAddress.startsWith('0x')) {
    assert(outputCcy, `output ${output} not found`);
    outputAddress = outputCcy.hash;
  }

  const aggregator = aggregatorArg || `${inputCcy?.symbol} / ${outputCcy?.symbol}`;
  let aggregatorAddress = aggregator;
  if (!aggregatorAddress.startsWith('0x')) {
    const aggregators = await getAllAggregators(chain);
    const newAggregator = aggregators.find((x) => x.name === aggregator);
    assert(newAggregator, `aggregator ${aggregator} not found`);
    aggregatorAddress = newAggregator?.proxyAddress;
  }
  assert(aggregatorAddress);

  await runUpdate('updateAggregator', [inputAddress, outputAddress, aggregatorAddress], args);
};
