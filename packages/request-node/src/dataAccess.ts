import { providers, Wallet } from 'ethers';
import { CurrencyTypes, DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';

import * as config from './config';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import { PendingStore } from '@requestnetwork/data-access';
import { EthereumStorage, EthereumTransactionSubmitter } from '@requestnetwork/ethereum-storage';

export function getDataAccess(
  network: CurrencyTypes.EvmChainName,
  ipfsStorage: StorageTypes.IIpfsStorage,
  logger: LogTypes.ILogger,
): DataAccessTypes.IDataAccess {
  const graphNodeUrl = config.getGraphNodeUrl();

  const wallet = Wallet.fromMnemonic(config.getMnemonic()).connect(
    new providers.StaticJsonRpcProvider(config.getStorageWeb3ProviderUrl()),
  );

  const signer = wallet;

  const gasPriceMin = config.getGasPriceMin();
  const blockConfirmations = config.getBlockConfirmations();
  const txSubmitter = new EthereumTransactionSubmitter({ network, logger, gasPriceMin, signer });
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
    network,
    logger,
    pendingStore,
  });
}
