import KeyvFile from 'keyv-file';
import { providers, Wallet } from 'ethers';
import { LogTypes } from '@requestnetwork/types';

import { TheGraphDataAccess } from './TheGraphDataAccess';
import { RequestNodeBase } from '../requestNodeBase';
import * as config from '../config';
import { getIpfsStorage } from '../storageUtils';

export class TheGraphRequestNode extends RequestNodeBase {
  constructor(url: string, logger?: LogTypes.ILogger) {
    const initializationStoragePath = config.getInitializationStorageFilePath();

    const store = initializationStoragePath
      ? new KeyvFile({
          filename: initializationStoragePath,
        })
      : undefined;

    const networkId = config.getStorageNetworkId();
    const network = networkId === 0 ? 'private' : providers.getNetwork(networkId).name;
    const signer = Wallet.fromMnemonic(config.getMnemonic()).connect(
      new providers.StaticJsonRpcProvider(config.getStorageWeb3ProviderUrl()),
    );
    const ipfsStorage = getIpfsStorage(logger);
    const dataAccess = new TheGraphDataAccess({
      graphql: { url },
      ipfsStorage,
      network,
      signer,
      logger: logger,
    });

    super(dataAccess, ipfsStorage, store, logger);
  }
}
