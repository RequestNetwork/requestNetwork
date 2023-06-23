import { providers, Wallet } from 'ethers';
import { NonceManager } from '@ethersproject/experimental';
import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';

import * as config from './config';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import {
  EthereumStorage,
  EthereumTransactionSubmitter,
  getEthereumStorageNetworkNameFromId,
} from '@requestnetwork/ethereum-storage';

export function getDataAccess(
  ipfsStorage: StorageTypes.IIpfsStorage,
  logger: LogTypes.ILogger,
): DataAccessTypes.IDataAccess {
  const graphNodeUrl = config.getGraphNodeUrl();

  const network = getEthereumStorageNetworkNameFromId(config.getStorageNetworkId()) as any;
  if (!network) {
    throw new Error(`Storage network not supported: ${config.getStorageNetworkId()}`);
  }

  const wallet = Wallet.fromMnemonic(config.getMnemonic()).connect(
    new providers.StaticJsonRpcProvider(config.getStorageWeb3ProviderUrl()),
  );

  const signer = new NonceManager(wallet);

  const gasPriceMin = config.getGasPriceMin();
  const blockConfirmations = config.getBlockConfirmations();
  const txSubmitter = new EthereumTransactionSubmitter({ network, logger, gasPriceMin, signer });
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
  });
}
