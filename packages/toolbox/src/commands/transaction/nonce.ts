/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as yargs from 'yargs';
import { InferArgs } from '../../types.js';
import { getProvider, getWallet } from './utils.js';

export const command = 'nonce';
export const describe = 'Gets a wallet nonce';

export const builder = (y: yargs.Argv) => {
  return y
    .option('chainName', { type: 'string', demandOption: true, desc: ' ' })
    .option('address', {
      type: 'string',
      desc: 'The wallet address to check. If unspecified, relies on the PRIVATE_KEY passed as env variable',
    });
};

export const handler = async (argv: InferArgs<ReturnType<typeof builder>>) => {
  let address = argv.address;
  const provider = await getProvider(argv.chainName);

  if (!address) {
    const wallet = await getWallet({ chainName: argv.chainName, provider });
    address = wallet.address;
  }
  const nonce = await provider.getTransactionCount(address);
  console.log(nonce);
};
