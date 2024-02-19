/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-console */

import { InferArgs } from '../../types';
import yargs from 'yargs';
import { getWallet } from './utils';
import { providers, utils } from 'ethers';
import { ChainManager } from '@requestnetwork/chain/src';
import { ChainTypes } from '@requestnetwork/types';

export const command = 'transaction retry <txHash>';
export const describe = 'Retries sending a pending transaction stuck in the mempool';

export const builder = (y: yargs.Argv) =>
  y
    .positional('txHash', { demandOption: true, type: 'string' })
    .option('chainName', { demandOption: true, type: 'string' })
    .option('increaseGas', { type: 'boolean', default: false })
    .option('increaseNonce', { type: 'boolean', default: false })
    .option('dryRun', { type: 'boolean', default: false });

export const handler = async (argv: yargs.Arguments<InferArgs<ReturnType<typeof builder>>>) => {
  const chain = ChainManager.current().fromName(argv.chainName, [ChainTypes.ECOSYSTEM.EVM]);
  const wallet = await getWallet({ chain, dryRun: argv.dryRun });

  const tx = await wallet.provider.getTransaction(argv.txHash);

  if (!tx) {
    console.warn(`Tx ${argv.txHash} not found`);
    return;
  }

  const newTx: providers.TransactionRequest = {
    value: tx.value,
    nonce: argv.increaseNonce ? undefined : tx.nonce,
    gasLimit: tx.gasLimit,
    gasPrice: argv.increaseGas ? utils.parseUnits('2', 'gwei') : tx.gasPrice,
    maxFeePerGas: argv.increaseGas ? utils.parseUnits('2', 'gwei') : tx.maxFeePerGas,
    maxPriorityFeePerGas: argv.increaseGas
      ? utils.parseUnits('1', 'gwei')
      : tx.maxPriorityFeePerGas,
    data: tx.data,
    from: tx.from,
    to: tx.to,
  };

  if (argv.dryRun) {
    console.log('DRY RUN');
    console.log(newTx);
  }

  if (wallet.address === tx.from) {
    // run estimate gas as a sanity check (especially useful in dry run)
    // but no need to run it if address isn't right...
    await wallet.estimateGas(newTx);
  } else if (!argv.dryRun) {
    throw new Error('Not using the right wallet!');
  }

  if (argv.dryRun) return;

  const { hash } = await wallet.sendTransaction(newTx);
  console.log(hash);
};
