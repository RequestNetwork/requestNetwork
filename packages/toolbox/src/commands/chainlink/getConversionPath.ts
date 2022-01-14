import * as yargs from 'yargs';
import { CurrencyManager } from '@requestnetwork/currency';

type Options = { to: string; from: string; network: string };

export const command = 'getConversionPath <from> <to>';
export const describe = 'Shows the conversion path between 2 currencies';
export const builder = (): yargs.Argv<Options> =>
  yargs
    .positional('to', {
      demandOption: true,
      type: 'string',
      desc: 'Currency code such as ETH or EUR',
    })
    .positional('from', {
      demandOption: true,
      type: 'string',
      desc: 'Currency code such as ETH or EUR',
    })
    .option('network', {
      demandOption: true,
      type: 'string',
      default: 'mainnet',
    });

export const handler = (args: yargs.Arguments<Options>): void => {
  const currencyManager = CurrencyManager.getDefault();
  const from = currencyManager.from(args.from)!;
  const to = currencyManager.from(args.to)!;
  console.log(currencyManager.getConversionPath(from, to, args.network));
};
