/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-console */

import { InferArgs } from '../../types';
import yargs from 'yargs';
import { getWallet } from '../transaction/utils';
import { EthereumTransactionSubmitter, IpfsStorage } from '@requestnetwork/ethereum-storage';
import { ChainManager } from '@requestnetwork/chain/src';
import { ChainTypes } from '@requestnetwork/types';

export const command = 'hash submit <ipfsHash>';
export const describe = 'Forces the submission of an IPFS hash to the Request HashStorage contract';

export const builder = (y: yargs.Argv) =>
  y
    .positional('ipfsHash', { demandOption: true, type: 'string' })
    .option('chainName', { demandOption: true, type: 'string' })
    .option('dryRun', { type: 'boolean', default: false });

export const handler = async (argv: yargs.Arguments<InferArgs<ReturnType<typeof builder>>>) => {
  const chain = ChainManager.current().fromName(argv.chainName, [ChainTypes.ECOSYSTEM.EVM]);

  const wallet = await getWallet({ chain, dryRun: argv.dryRun });
  const ipfsStorage = new IpfsStorage({
    ipfsTimeout: 5000,
  });
  await ipfsStorage.initialize();
  const ipfsSize = await ipfsStorage.getSize(argv.ipfsHash);

  const txSubmitter = new EthereumTransactionSubmitter({ signer: wallet, network: argv.chainName });

  const encoded = await txSubmitter.prepareSubmit(argv.ipfsHash, ipfsSize);

  if (argv.dryRun) {
    console.log('DRY RUN');
    console.log(encoded);
    return;
  }

  const { hash } = await wallet.sendTransaction(encoded);
  console.log(hash);
};
