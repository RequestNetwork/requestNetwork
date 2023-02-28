import KeyvFile from 'keyv-file';
import { providers, Wallet } from 'ethers';
import { NonceManager } from '@ethersproject/experimental';
import { LogTypes } from '@requestnetwork/types';

import { RequestNodeBase } from './requestNodeBase';
import * as config from './config';
import { getIpfsStorage } from './storageUtils';
import { TheGraphDataAccess } from '@requestnetwork/thegraph-data-access';
import { EthereumStorageEthers } from '@requestnetwork/ethereum-storage';
import { SimpleLogger } from '@requestnetwork/utils';

const getNetworkFromId = (networkId: number) => {
  const customNames: Record<number, string> = {
    0: 'private',
    1: 'mainnet',
  };
  return customNames[networkId] || providers.getNetwork(networkId).name;
};
export class TheGraphRequestNode extends RequestNodeBase {
  constructor(url: string, logger?: LogTypes.ILogger) {
    const initializationStoragePath = config.getInitializationStorageFilePath();
    logger = logger || new SimpleLogger();

    const store = initializationStoragePath
      ? new KeyvFile({
          filename: initializationStoragePath,
        })
      : undefined;

    const network = getNetworkFromId(config.getStorageNetworkId());
    const wallet = Wallet.fromMnemonic(config.getMnemonic()).connect(
      new providers.StaticJsonRpcProvider(config.getStorageWeb3ProviderUrl()),
    );
    const signer = new NonceManager(wallet);
    const ipfsStorage = getIpfsStorage(logger);
    const gasPriceMin = config.getGasPriceMin();
    const blockConfirmations = config.getBlockConfirmations();
    const storage = new EthereumStorageEthers({
      ipfsStorage,
      signer,
      network,
      logger,
      gasPriceMin,
      blockConfirmations,
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
