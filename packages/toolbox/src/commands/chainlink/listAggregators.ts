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
  });
export const handler = listAggregators;
