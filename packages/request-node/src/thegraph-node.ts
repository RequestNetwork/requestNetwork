import KeyvFile from 'keyv-file';
import { providers, Wallet } from 'ethers';
import { NonceManager } from '@ethersproject/experimental';
import { LogTypes } from '@requestnetwork/types';

import { RequestNodeBase } from './requestNodeBase';
import * as config from './config';
import { getIpfsStorage } from './storageUtils';
import Utils from '@requestnetwork/utils';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-storage';
import { EthereumStorageEthers } from '@requestnetwork/ethereum-storage';

export class TheGraphRequestNode extends RequestNodeBase {
  constructor(url: string, logger?: LogTypes.ILogger) {
    const initializationStoragePath = config.getInitializationStorageFilePath();
    logger = logger || new Utils.SimpleLogger();

    const store = initializationStoragePath
      ? new KeyvFile({
          filename: initializationStoragePath,
        })
      : undefined;

    const networkId = config.getStorageNetworkId();
    const network = networkId === 0 ? 'private' : providers.getNetwork(networkId).name;
    const wallet = Wallet.fromMnemonic(config.getMnemonic()).connect(
      new providers.StaticJsonRpcProvider(config.getStorageWeb3ProviderUrl()),
    );
    const signer = new NonceManager(wallet);
    const ipfsStorage = getIpfsStorage(logger);
    const storage = new EthereumStorageEthers({
      ipfsStorage,
      signer,
      network,
      logger,
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
