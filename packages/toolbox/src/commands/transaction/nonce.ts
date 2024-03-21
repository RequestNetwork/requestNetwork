/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as yargs from 'yargs';
import { InferArgs } from '../../types';
import { getProvider, getWallet } from './utils';
import { ChainManager } from '@requestnetwork/chain/src';
import { ChainTypes } from '@requestnetwork/types';

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
  const chain = ChainManager.current().fromName(argv.chainName, [ChainTypes.ECOSYSTEM.EVM]);
  const provider = await getProvider(chain);

  if (!address) {
    const wallet = await getWallet({ chain, provider });
    address = wallet.address;
  }
  const nonce = await provider.getTransactionCount(address);
  console.log(nonce);
};
