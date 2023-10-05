import * as yargs from 'yargs';
import { IOptions, listAggregators } from '../../chainlinkConversionPathTools';

export const command = 'listAggregators [network]';
export const describe = 'Helper for on-chain conversion administration';
export const builder = (): yargs.Argv<IOptions> =>
  yargs.env().options({
    network: {
      demand: false,
      type: 'string',
      desc: 'Network for which to list aggregators (mainnet, rinkeby, private)',
    },
    web3Url: {
      demand: false,
      type: 'string',
      desc: 'A Web3 RPC url. If not provided will use the default',
    },
    maxRange: {
      demand: false,
      type: 'number',
      desc: 'The maximum number of blocks to query in parallel. Defaults to 5000',
    },
  });
export const handler = listAggregators;
