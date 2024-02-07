import { CurrencyTypes, StorageTypes } from '@requestnetwork/types';
import { BigNumber } from 'ethers';

// This contains default values used to use Ethereum Network and IPFS
// if information are not provided by the user
const config = {
  ethereum: {
    default: 'private' as const,
    gasPriceDefault: '100000000000',
    maxRetries: 5,
    nodeUrlDefault: {
      private: {
        timeout: 30000,
        url: 'http://localhost:8545',
      },
    },
    safeGasPriceLimit: '500000000000',
    transactionPollingTimeout: 300,
    blockConfirmations: 2,
  },
  ipfs: {
    url: 'http://localhost:5001',
    timeout: 30000,
    errorHandling: {
      delayBetweenRetries: 500,
      maxRetries: 3,
    },
    expectedBootstrapNodes: {
      'ipfs-bootstrap.request.network': 'QmaSrBXFBaupfeGMTuigswtKtsthbVaSonurjTV967Fdxx',
      'ipfs-bootstrap-2.request.network': 'QmYdcSoVNU1axgSnkRAyHtwsKiSvFHXeVvRonGCAV9LVEj',
      'ipfs-2.request.network': 'QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd',
      'ipfs-survival.request.network': 'Qmb6a5DH45k8JwLdLVZUhRhv1rnANpsbXjtsH41esGhNCh',
    },
    maxIpfsReadRetry: 1,
  },
};

export function getDefaultIpfsUrl(): string {
  return config.ipfs.url;
}

export function getDefaultIpfsTimeout(): number {
  return config.ipfs.timeout;
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
export function getDefaultEthereumNetwork(): ChainTypes.IEvmChain {
  return config.ethereum.default;
}

/**
 * Retrieve from config the default gas price to make transactions into Ethereum network
 * @returns the gas price as a string
 */
export function getDefaultEthereumGasPrice(): BigNumber {
  return BigNumber.from(process?.env?.GAS_PRICE_DEFAULT || config.ethereum.gasPriceDefault);
}

/**
 * Retrieve from config the default number of block confirmations to wait before considering a transaction successful
 * @returns the number of block confirmations
 */
export function getDefaultEthereumBlockConfirmations(): number {
  return config.ethereum.blockConfirmations;
}

/**
 * Retrieve from config the maximum number of query retries
 * @returns the maximum amount of query retries
 */
export function getEthereumMaxRetries(): number {
  return config.ethereum.maxRetries;
}

/**
 * Retrieve from config the safe gas price limit
 * This value ensures we don't use a value returned by an API provider
 * that can be unsafe to use (very high gas price that generate loss of ether)
 * @returns safe gas price limit
 */
export function getSafeGasPriceLimit(): string {
  return process?.env?.SAFE_GAS_PRICE_LIMIT || config.ethereum.safeGasPriceLimit;
}

/**
 * Retrieve from config the maximum number of retries on failed IPFS calls
 * @returns array of the swarm addresses
 */
export function getIpfsErrorHandlingConfig(): StorageTypes.IIpfsErrorHandlingConfiguration {
  return {
    delayBetweenRetries: config.ipfs.errorHandling.delayBetweenRetries,
    maxRetries: config.ipfs.errorHandling.maxRetries,
  };
}

/**
 * Retrieve from config the ipfs bootstrap nodes of the ipfs node
 * @returns array of the swarm addresses regexes
 */
export function getIpfsExpectedBootstrapNodes(): RegExp[] {
  return Object.entries(config.ipfs.expectedBootstrapNodes).map(
    ([host, id]) => new RegExp(`/dns4/${host}/tcp/4001/(ipfs|p2p)/${id}`),
  );
}

/**
 * Retrieve from config the number of times we retry to read hashes on IPFS
 * @returns Number of times we retry to read hashes on IPFS
 */
export function getMaxIpfsReadRetry(): number {
  return config.ipfs.maxIpfsReadRetry;
}

/**
 * Retrieve from config the amount of time to wait before a transaction is considered failed
 */
export function getTransactionPollingTimeout(): number {
  return config.ethereum.transactionPollingTimeout;
}
