import { IOptions, showCurrencyHash } from '../../chainlinkConversionPathTools';
import * as yargs from 'yargs';

export const command = 'currencyHash <currencyCode>';
export const describe = 'Shows the currency hash of a currency code';
export const builder = (): yargs.Argv<IOptions> =>
  yargs.options({
    currencyCode: {
      demand: true,
      type: 'string',
      desc: 'Currency code such as ETH or EUR',
    },
  });
export const handler = showCurrencyHash;
