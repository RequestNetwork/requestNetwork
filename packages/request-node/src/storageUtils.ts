import { EthereumStorage } from '@requestnetwork/ethereum-storage';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import * as config from './config';

import Keyv from 'keyv';

import { Wallet, providers } from 'ethers';

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
  metadataStore?: Keyv.Store<string[]>,
): EthereumStorage {
  // Initializes IPFS gateway connection object
  const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
    host: config.getIpfsHost(),
    port: config.getIpfsPort(),
    protocol: config.getIpfsProtocol(),
    timeout: config.getIpfsTimeout(),
  };

  // Initializes web3 connection object

  let provider: providers.Provider;
  const url = config.getStorageWeb3ProviderUrl();
  if (url.match('^wss?://.+')) {
    provider = new providers.WebSocketProvider(url);
    // FIXME previous WS config
    // {
    //   clientConfig: {
    //     keepalive: true,
    //     keepaliveInterval: 10000, // ms
    //   },
    //   // Enable auto reconnection
    //   reconnect: {
    //     auto: true,
    //     delay: 3000, // ms
    //     maxAttempts: 5,
    //     onTimeout: false,
    //   },
    // }
  } else {
    provider = new providers.StaticJsonRpcProvider(url);
  }
  const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  const web3Connection: StorageTypes.IWeb3Connection = {
    networkId: config.getStorageNetworkId(),
    signer: wallet,
  };

  const store = new Keyv<string[]>({
    namespace: 'EthereumStorage',
    store: metadataStore,
  });

  return new EthereumStorage(
    config.getServerExternalUrl(),
    ipfsGatewayConnection,
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
