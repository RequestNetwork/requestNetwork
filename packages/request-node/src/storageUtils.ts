import { EthereumStorage, IpfsStorage } from '@requestnetwork/ethereum-storage';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import * as config from './config';

import Keyv from 'keyv';
import KeyvFile from 'keyv-file';

import Web3WsProvider from 'web3-providers-ws';
import HDWalletProvider from '@truffle/hdwallet-provider';

export function getIpfsStorage(logger?: LogTypes.ILogger): StorageTypes.IIpfsStorage {
  return new IpfsStorage({ ipfsGatewayConnection: config.getIpfsConfiguration(), logger });
}

/**
 * Get the ethereum storage with values from config
 * @param mnemonic: mnemonic for the web3 wallet
 * @param logger: logger object for the logs
 * @param metadataStore a Keyv store to persist the metadata in ethereumMetadataCache
 * @returns ethereum storage object
 */
export function getEthereumStorage(
  mnemonic: string,
  ipfsStorage: StorageTypes.IIpfsStorage,
  logger?: LogTypes.ILogger,
  metadataStore?: KeyvFile,
): EthereumStorage {
  // Initializes web3 connection object
  let provider: HDWalletProvider;
  if (config.getStorageWeb3ProviderUrl().match('^wss?://.+')) {
    provider = new HDWalletProvider({
      mnemonic,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      providerOrUrl: new Web3WsProvider(config.getStorageWeb3ProviderUrl(), {
        clientConfig: {
          keepalive: true,
          keepaliveInterval: 10000, // ms
        },
        // Enable auto reconnection
        reconnect: {
          auto: true,
          delay: 3000, // ms
          maxAttempts: 5,
          onTimeout: false,
        },
      }),
    });
  } else {
    provider = new HDWalletProvider(mnemonic, config.getStorageWeb3ProviderUrl());
  }

  const web3Connection: StorageTypes.IWeb3Connection = {
    networkId: config.getStorageNetworkId(),
    web3Provider: provider,
  };

  const store = new Keyv<string[]>({
    namespace: 'EthereumStorage',
    store: metadataStore,
  });

  return new EthereumStorage(
    config.getServerExternalUrl(),
    ipfsStorage,
    web3Connection,
    {
      getLastBlockNumberDelay: config.getLastBlockNumberDelay(),
      logger,
      maxConcurrency: config.getStorageConcurrency(),
      retryDelay: config.getEthereumRetryDelay(),
    },
    store,
  );
}
