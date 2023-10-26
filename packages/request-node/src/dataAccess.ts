import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';

import * as config from './config';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import { PendingStore } from '@requestnetwork/data-access';
import { EthereumStorage, EthereumTransactionSubmitter } from '@requestnetwork/ethereum-storage';
import { createWalletClient, http, Chain } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

export function getDataAccess(
  chain: Chain,
  ipfsStorage: StorageTypes.IIpfsStorage,
  logger: LogTypes.ILogger,
): DataAccessTypes.IDataAccess {
  const graphNodeUrl = config.getGraphNodeUrl();

  const account = mnemonicToAccount(config.getMnemonic());
  const client = createWalletClient({ account, transport: http(), chain });
  const blockConfirmations = config.getBlockConfirmations();
  const txSubmitter = new EthereumTransactionSubmitter({ chain, client, logger });
  console.log(txSubmitter.hashSubmitterAddress);
  const pendingStore = new PendingStore();
  const storage = new EthereumStorage({
    ipfsStorage,
    txSubmitter,
    logger,
    blockConfirmations,
  });
  return new TheGraphDataAccess({
    graphql: { url: graphNodeUrl },
    storage,
    network: chain.name,
    logger,
    pendingStore,
  });
}
