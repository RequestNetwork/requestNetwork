import { DataAccess, TransactionIndex } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';

import KeyvFile from 'keyv-file';

import { getInitializationStorageFilePath, getMnemonic } from './config';
import { getEthereumStorage, getIpfsStorage } from './storageUtils';

import { RequestNodeBase } from './requestNodeBase';

export class RequestNode extends RequestNodeBase {
  constructor(logger?: LogTypes.ILogger) {
    const initializationStoragePath = getInitializationStorageFilePath();

    const store = initializationStoragePath
      ? new KeyvFile({
          filename: initializationStoragePath,
        })
      : undefined;
    const ipfsStorage = getIpfsStorage(logger);
    // Use ethereum storage for the storage layer
    const ethereumStorage = getEthereumStorage(getMnemonic(), ipfsStorage, logger, store);

    // Use an in-file Transaction index if a path is specified, an in-memory otherwise
    const transactionIndex = new TransactionIndex(store);

    const dataAccess = new DataAccess(ethereumStorage, {
      logger,
      transactionIndex,
      autoStartSynchronization: true,
    });
    super(dataAccess, ipfsStorage, store, logger);
  }
}
