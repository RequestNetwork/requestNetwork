import * as yargs from 'yargs';
import { IOptions, listAggregators } from '../../chainlinkConversionPathTools';

export const command = 'listAggregators [network]';
export const describe = 'Helper for on-chain conversion administration';
export const builder = (): yargs.Argv<IOptions> =>
  yargs.options({
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
    lastBlock: {
      demand: false,
      type: 'number',
      desc:
        'If specified, will check until this block. Useful for networks with a limitation on the block range',
    },
  });
export const handler = listAggregators;
