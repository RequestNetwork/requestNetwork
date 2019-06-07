import { StorageTypes } from '@requestnetwork/types';

// This contains default values used to use Ethereum Network and IPFS
// if information are not provided by the user
const config: any = {
  ethereum: {
    default: 'private',
    gasPriceDefault: '4000000000',
    maxRetries: 5,
    nodeUrlDefault: {
      private: {
        timeout: 30000,
        url: 'http://localhost:8545',
      },
    },
    retryDelay: 0,
  },
  ipfs: {
    default: 'private',
    nodeUrlDefault: {
      private: {
        port: 5001,
        private: 'localhost',
        protocol: 'http',
        timeout: 10000,
      },
      public: {
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        timeout: 10000,
      },
    },
    pinRequest: {
      delayBetweenCalls: 1000,
      maxSize: 500,
      timeout: 30000,
    },
    // ipfs nodes that already have the request files (allow to get the request data faster)
    requestKnownIpfsNode: [
      // Request IPFS node 1
      // eslint-disable-next-line spellcheck/spell-checker
      '/dns4/ipfs.request.network/tcp/4001/ipfs/QmZz7AHe5i8Vj2hhepfWhPKYpccNQHnAUFnjps2cnZLAPC',
      // Request IPFS node 2
      // eslint-disable-next-line spellcheck/spell-checker
      '/dns4/ipfs-2.request.network/tcp/4001/ipfs/QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd',
      // Request API IPFS node
      // eslint-disable-next-line spellcheck/spell-checker
      '/dns4/ipfs-3.request.network/tcp/4001/ipfs/QmZSubr9XbQdzFtEnpmPE2KCVHJYSH5soZ987na1oDFjQM',
    ],
  },
  maxConcurrency: Number.MAX_SAFE_INTEGER,
};

/**
 * Retrieve from config the default information to connect to ipfs
 * @returns IIpfsGatewayConnection the host, port, protocol and timeout threshold to connect to the gateway
 */
export function getDefaultIpfs(): StorageTypes.IIpfsGatewayConnection {
  return config.ipfs.nodeUrlDefault[config.ipfs.default];
}

/**
 * Retrieve from config the default provider url for Ethereum
 * @returns the url to connect to the network
 */
export function getDefaultEthereumProvider(): string {
  return config.ethereum.nodeUrlDefault[config.ethereum.default].url;
}

/**
 * Retrieve from config the timeout threshold for the default provider url for Ethereum
 * @returns the url to connect to the network
 */
export function getDefaultEthereumProviderTimeout(): number {
  return config.ethereum.nodeUrlDefault[config.ethereum.default].timeout;
}

/**
 * Retrieve from config the default name of the network for Ethereum
 * @returns the name of the network
 */
export function getDefaultEthereumNetwork(): string {
  return config.ethereum.default;
}

/**
 * Retrieve from config the default gas price to make transactions into Ethereum network
 * @returns the gas price as a string
 */
export function getDefaultEthereumGasPrice(): string {
  return config.ethereum.gasPriceDefault;
}

/**
 * Retrieve from config the time to wait between query retries
 * @returns the query retry delay
 */
export function getEthereumRetryDelay(): number {
  return config.ethereum.retryDelay;
}

/**
 * Retrieve from config the maximum number of query retries
 * @returns the maximum amount of query retries
 */
export function getEthereumMaxRetries(): number {
  return config.ethereum.maxRetries;
}

/**
 * Retrieve from config the maximum number of concurrent calls made from the ethereum-storage
 * @returns the maximum amount concurrent calls
 */
export function getMaxConcurrency(): number {
  return config.maxConcurrency;
}

/**
 * Retrieve from config the default swarm peers for ipfs
 * @returns array of the swarm addresses
 */
export function getDefaultIpfsSwarmPeers(): string[] {
  return config.ipfs.requestKnownIpfsNode;
}

/**
 * Retrieve from config the default pin request maximum size, timeout and wait time between calls
 * @returns array of the swarm addresses
 */
export function getPinRequestConfig(): StorageTypes.IPinRequestConfiguration {
  return {
    delayBetweenCalls: config.ipfs.pinRequest.delayBetweenCalls,
    maxSize: config.ipfs.pinRequest.maxSize,
    timeout: config.ipfs.pinRequest.timeout,
  };
}
