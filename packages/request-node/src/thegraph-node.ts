import KeyvFile from 'keyv-file';
import { providers, Wallet } from 'ethers';
import { NonceManager } from '@ethersproject/experimental';
import { LogTypes } from '@requestnetwork/types';

import { RequestNodeBase } from './requestNodeBase';
import * as config from './config';
import { getIpfsStorage } from './storageUtils';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import {
  EthereumStorageEthers,
  getEthereumStorageNetworkNameFromId,
} from '@requestnetwork/ethereum-storage';
import { SimpleLogger } from '@requestnetwork/utils';

export class TheGraphRequestNode extends RequestNodeBase {
  constructor(url: string, logger?: LogTypes.ILogger) {
    const initializationStoragePath = config.getInitializationStorageFilePath();
    logger = logger || new SimpleLogger();

    const store = initializationStoragePath
      ? new KeyvFile({
          filename: initializationStoragePath,
        })
      : undefined;

    const network = getEthereumStorageNetworkNameFromId(config.getStorageNetworkId());
    if (!network) {
      throw new Error(`Storage network not supported: ${config.getStorageNetworkId()}`);
    }

    const wallet = Wallet.fromMnemonic(config.getMnemonic()).connect(
      new providers.StaticJsonRpcProvider(config.getStorageWeb3ProviderUrl()),
    );
    const signer = new NonceManager(wallet);
    const ipfsStorage = getIpfsStorage(logger);
    const gasPriceMin = config.getGasPriceMin();
    const storage = new EthereumStorageEthers({
      ipfsStorage,
      signer,
      network,
      logger,
      gasPriceMin,
    });
    const dataAccess = new TheGraphDataAccess({
      graphql: { url },
      storage,
      network,
      logger,
    });

    super(dataAccess, ipfsStorage, store, logger);
  }
}
