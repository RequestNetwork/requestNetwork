import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { argv } from 'yargs';
import { modeType } from './logger';

// Load environment variables from .env file (without overriding variables already set)
import { config } from 'dotenv';
config();

/**
 * This contains default values used for the server and storage initialization
 * when environment variable is not specified
 */
const defaultValues: any = {
  ethereumStorage: {
    ethereum: {
      networkId: 0,
      web3ProviderUrl: 'http://localhost:8545',
    },
    ipfs: {
      host: 'localhost',
      port: 5001,
      protocol: 'http',
      timeout: 30000,
    },
    lastBlockNumberDelay: 10000,
    maxConcurrency: 5,
    persistTransactionTimeout: 600,
    retryDelay: 1000,
  },
  log: {
    level: LogTypes.LogLevel.INFO,
    mode: modeType.human,
  },
  server: {
    externalUrl: 'localhost',
    headers: '{}',
    port: 3000,
  },
  wallet: {
    mnemonic: 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
  },
};

/**
 * Get the external url of the node (used to identified where the buffer data are stored before being broadcasted)
 * @returns the external url
 */
export function getServerExternalUrl(): string {
  return argv.externalUrl || process.env.EXTERNAL_URL || defaultValues.server.externalUrl;
}

/**
 * Get the port from command line argument, environment variables or default values to allow user to connect to the server
 * @returns the port to listen to connection on the server
 */
export function getServerPort(): number {
  return (
    (argv.port && Number(argv.port)) ||
    (process.env.PORT && Number(process.env.PORT)) ||
    defaultValues.server.port
  );
}

/**
 * Get custom headers as a JSON stringified object from command line argument, environment variables or default values
 * @returns an object with the custom headers to be set
 */
export function getCustomHeaders(): Record<string, string> {
  const headersString = argv.headers || process.env.HEADERS || defaultValues.server.headers;

  try {
    return JSON.parse(headersString);
  } catch (e) {
    throw new Error('Custom headers must be a valid JSON object');
  }
}

/**
 * Get network id of the Ethereum network from command line argument, environment variables or default values
 * @returns Ethereum network id
 */
export function getStorageNetworkId(): number {
  return (
    (argv.networkId && Number(argv.networkId)) ||
    (process.env.ETHEREUM_NETWORK_ID && Number(process.env.ETHEREUM_NETWORK_ID)) ||
    defaultValues.ethereumStorage.ethereum.networkId
  );
}

/**
 * Get Web3 provider url from command line argument, environment variables or default values
 * @returns Web3 provider url
 */
export function getStorageWeb3ProviderUrl(): string {
  return (
    argv.providerUrl ||
    process.env.WEB3_PROVIDER_URL ||
    defaultValues.ethereumStorage.ethereum.web3ProviderUrl
  );
}

export function getGraphNodeUrl(): string | undefined {
  return (
    argv.graphNodeUrl ||
    process.env.GRAPH_NODE_URL ||
    defaultValues.ethereumStorage.ethereum.graphNodeUrl
  );
}

/**
 * Get host from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the host of the IPFS gateway
 */
export function getIpfsHost(): string {
  return argv.ipfsHost || process.env.IPFS_HOST || defaultValues.ethereumStorage.ipfs.host;
}

/**
 * Get port from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the port of the IPFS gateway
 */
export function getIpfsPort(): number {
  return (
    (argv.ipfsPort && Number(argv.ipfsPort)) ||
    (process.env.IPFS_PORT && Number(process.env.IPFS_PORT)) ||
    defaultValues.ethereumStorage.ipfs.port
  );
}

/**
 * Get protocol from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the protocol to connect to the IPFS gateway
 */
export function getIpfsProtocol(): StorageTypes.IpfsGatewayProtocol {
  return (
    argv.ipfsProtocol || process.env.IPFS_PROTOCOL || defaultValues.ethereumStorage.ipfs.protocol
  );
}

/**
 * Get the timeout threshold from command line argument, environment variables or default values for IPFS gateway connection
 * If the connection delay for IPFS gateway reachs this value, the connection fails
 * @returns the timeout threshold for IPFS gateway connection
 */
export function getIpfsTimeout(): number {
  return (
    (argv.ipfsTimeout && Number(argv.ipfsTimeout)) ||
    (process.env.IPFS_TIMEOUT && Number(process.env.IPFS_TIMEOUT)) ||
    defaultValues.ethereumStorage.ipfs.timeout
  );
}

/**
 * Get the mnemonic from environment variables or default values to generate the private key for the wallet
 * The default value must only be used for test purposes
 * For production, mnemonic should always be provided as environment variable
 * @returns the mnemonic for HDWallet
 */
export function getMnemonic(): string {
  if (!process.env.MNEMONIC) {
    if (getStorageNetworkId() !== 0) {
      throw new Error(
        'the environment variable MNEMONIC must be set up. The default mnemonic is only for private network.',
      );
    }
    return defaultValues.wallet.mnemonic;
  }
  return process.env.MNEMONIC;
}

/**
 * Get log configs: level and mode, from command line argument, environment variables or default values.
 * logLevel is the maximum level of messages we will log
 * logMode defines the log format to display: `human` is a more readable log, `machine` is better for parsing
 *
 * @returns the log level
 */
export function getLogConfig(): { logLevel: LogTypes.LogLevel; logMode: modeType } {
  return {
    logLevel:
      LogTypes.LogLevel[
        (argv.logLevel || process.env.LOG_LEVEL) as keyof typeof LogTypes.LogLevel
      ] || defaultValues.log.level,
    logMode:
      modeType[(argv.logMode || process.env.LOG_MODE) as keyof typeof modeType] ||
      defaultValues.log.mode,
  };
}

/**
 * Get the minimum delay between getLastBlockNumber calls
 *
 * @returns the minimum delay between last block number fetches
 */
export function getLastBlockNumberDelay(): number {
  return (
    argv.lastBlockNumberDelay ||
    process.env.LAST_BLOCK_NUMBER_DELAY ||
    defaultValues.ethereumStorage.lastBlockNumberDelay
  );
}

/**
 * Get the number of concurrent calls the ethereum storage can make
 *
 * @returns the maximum concurrency number
 */
export function getStorageConcurrency(): number {
  return Number(
    argv.storageMaxConcurrency ||
      process.env.STORAGE_MAX_CONCURRENCY ||
      defaultValues.ethereumStorage.maxConcurrency,
  );
}

/**
 * Get the delay between subsequent Ethereum call retries
 *
 * @returns the delay between call retries
 */
export function getEthereumRetryDelay(): number {
  return (
    argv.ethereumRetryDelay ||
    process.env.ETHEREUM_RETRY_DELAY ||
    defaultValues.ethereumStorage.retryDelay
  );
}

/**
 * Get the initialization storage (a json-like file) path.
 * @returns the path to the json-like file that stores the initialization data (ethereum metadata and transaction index).
 */
export function getInitializationStorageFilePath(): string | null {
  return (
    (argv.initializationStorageFilePath as string) ||
    process.env.INITIALIZATION_STORAGE_FILE_PATH ||
    null
  );
}

/**
 * Get the delay to wait before sending a timeout when performing a persistTransaction request
 * persistTransaction is called when a request is created or updated and need to wait for Ethereum to commit the transaction
 * PROT-300: This configuration value can be removed once batching is implenented
 * because there will be no more need to wait for the smart contract
 * @returns THe delay to wait for the timeout
 */
export function getPersistTransactionTimeout(): number {
  return (
    argv.persistTransactionTimeout ||
    process.env.PERSIST_TRANSACTION_TIMEOUT ||
    defaultValues.ethereumStorage.persistTransactionTimeout
  );
}

/**
 * Get the IPFS connection configuration.
 */
export function getIpfsConfiguration(): StorageTypes.IIpfsGatewayConnection {
  return {
    host: getIpfsHost(),
    port: getIpfsPort(),
    protocol: getIpfsProtocol(),
    timeout: getIpfsTimeout(),
  };
}

/**
 * Get the mnemonic from command line argument, environment variables or default values to generate the private key for the wallet
 * The default value must only be used for test purposes
 * For production, mnemonic should always be provided as environment variable
 * @returns the mnemonic for HDWallet
 */
export function getHelpMessage(): string {
  const message = `USAGE
    request-node - Node for request protocol v2

    yarn start <options>

    OPTIONS
      SERVER OPTIONS
        port (${defaultValues.server.port})\t\t\t\tPort for the server to listen for API requests
        headers (${defaultValues.server.headers})\t\t\t\tCustom headers to send with the API responses
        externalUrl (${defaultValues.server.externalUrl})\t\t\t\tExternal url of the node (used to identified where the buffer data are stored before being broadcasted)

      ETHEREUM OPTIONS
        networkId (${defaultValues.ethereumStorage.ethereum.networkId})\t\t\t\tId of the Ethereum network used
        providerUrl (${defaultValues.ethereumStorage.ethereum.web3ProviderUrl})\tUrl of the web3 provider for Ethereum
        LastBlockNumberDelay (${defaultValues.ethereumStorage.lastBlockNumberDelay} ms)\t\t\tThe minimum delay between getLastBlockNumber calls
        EthereumRetryDelay (${defaultValues.ethereumStorage.retryDelay})\t\t\tThe delay between subsequent call retries

      IPFS OPTIONS
        ipfsHost (${defaultValues.ethereumStorage.ipfs.host})\t\t\tHost of the IPFS gateway
        ipfsPort (${defaultValues.ethereumStorage.ipfs.port})\t\t\t\tPort of the IPFS gateway
        ipfsProtocol (${defaultValues.ethereumStorage.ipfs.protocol})\t\t\tProtocol used to connect to the IPFS gateway
        ipfsTimeout (${defaultValues.ethereumStorage.ipfs.timeout})\t\t\tTimeout threshold to connect to the IPFS gateway

      OTHER OPTIONS
        storageMaxConcurrency (${defaultValues.ethereumStorage.maxConcurrency})\t\t\tMaximum number of concurrent calls to Ethereum or IPFS

        logLevel (${defaultValues.log.level})\t\t\tThe node log level (ERROR, WARN, INFO or DEBUG)
        logMode (${defaultValues.log.mode})\t\t\tThe node log mode (human or machine)

    EXAMPLE
      yarn start --port 5000 --networkId 1 --ipfsPort 6000

  All options are optional, not specified options are read from environment variables
  If the environment variable is not specified, default value is used

  Default mnemonic is:
  ${defaultValues.wallet.mnemonic}
`;

  return message;
}
