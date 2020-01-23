import { CacheEthereumStorage } from '@requestnetwork/cache-ethereum-storage';
import { EthereumStorage } from '@requestnetwork/ethereum-storage';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import * as config from './config';

import KeyvFile from 'keyv-file';

const hdWalletProvider = require('@truffle/hdwallet-provider');

/**
 * Get the ethereum storage with values from config
 * @param mnemonic: mnemonic for the web3 wallet
 * @param logger: logger object for the logs
 * @param metadataStore a Keyv store to persist the metadata in ethereumMetadataCache
 * @returns ethereum storage object
 */
export function getEthereumStorage(
  mnemonic: string,
  logger: LogTypes.ILogger,
  metadataStore?: KeyvFile,
): { cacheEthereumStorage: CacheEthereumStorage; ethereumStorage: EthereumStorage } {
  // Initializes IPFS gateway connection object
  const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
    host: config.getIpfsHost(),
    port: config.getIpfsPort(),
    protocol: config.getIpfsProtocol(),
    timeout: config.getIpfsTimeout(),
  };

  // Initializes web3 connection object
  const provider = new hdWalletProvider(mnemonic, config.getStorageWeb3ProviderUrl());

  const web3Connection: StorageTypes.IWeb3Connection = {
    networkId: config.getStorageNetworkId(),
    web3Provider: provider,
  };

  const ethereumStorage = new EthereumStorage(
    ipfsGatewayConnection,
    web3Connection,
    {
      enableFastAppend: true,
      getLastBlockNumberDelay: config.getLastBlockNumberDelay(),
      logger,
      maxConcurrency: config.getStorageConcurrency(),
      retryDelay: config.getEthereumRetryDelay(),
    },
    metadataStore,
  );

  const cacheEthereumStorage = new CacheEthereumStorage(ethereumStorage, 'TODO', logger);

  return { cacheEthereumStorage, ethereumStorage };
}
