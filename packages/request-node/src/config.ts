import { LogTypes, StorageTypes } from '@requestnetwork/types';
import * as yargs from 'yargs';
import { LogMode } from './logger';
import { config } from 'dotenv';
import { BigNumber } from 'ethers';

const argv = yargs.parseSync();

// Load environment variables from .env file (without overriding variables already set)
config();

/**
 * This contains default values used for the server and storage initialization
 * when environment variable is not specified
 */
const defaultValues = {
  ethereumStorage: {
    ethereum: {
      networkId: 0,
      web3ProviderUrl: 'http://localhost:8545',
      gasPriceMin: '1000000000', // one gwei
      blockConfirmations: 2,
      graphNodeUrl: '',
    },
    ipfs: {
      host: 'localhost',
      port: 5001,
      protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
      timeout: 30000,
    },
    lastBlockNumberDelay: 10000,
    maxConcurrency: 5,
    persistTransactionTimeout: 600,
    retryDelay: 1000,
  },
  log: {
    level: LogTypes.LogLevel.INFO,
    mode: LogMode.human,
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

const getOption = <T extends string | number>(
  argName: string,
  envName: string,
  defaultValue?: T,
): T => {
  const val = argv[argName] || process.env[envName] || defaultValue;
  if (typeof defaultValue === 'number') return Number(val) as T;
  return String(val) as T;
};
const makeOption =
  <T extends string | number>(...params: Parameters<typeof getOption<T>>) =>
  () =>
    getOption<T>(...params);

/**
 * Get the external url of the node (used to identified where the buffer data are stored before being broadcasted)
 */
export const getServerExternalUrl = makeOption(
  'externalUrl',
  'EXTERNAL_URL',
  defaultValues.server.externalUrl,
);

/**
 * Get the port from command line argument, environment variables or default values to allow user to connect to the server
 */
export const getServerPort = makeOption('port', 'PORT', defaultValues.server.port);

/**
 * Get custom headers as a JSON stringified object from command line argument, environment variables or default values
 */
export function getCustomHeaders(): Record<string, string> {
  const headersString = getOption('headers', 'HEADERS', defaultValues.server.headers);

  try {
    return JSON.parse(headersString);
  } catch (e) {
    throw new Error('Custom headers must be a valid JSON object');
  }
}

/**
 * Get network id of the Ethereum network from command line argument, environment variables or default values
 */
export const getStorageNetworkId = makeOption(
  'networkId',
  'ETHEREUM_NETWORK_ID',
  defaultValues.ethereumStorage.ethereum.networkId,
);

/**
 * Get Web3 provider url from command line argument, environment variables or default values
 */
export const getStorageWeb3ProviderUrl = makeOption(
  'providerUrl',
  'WEB3_PROVIDER_URL',
  defaultValues.ethereumStorage.ethereum.web3ProviderUrl,
);

/** Get the Graph node URL */
export const getGraphNodeUrl = makeOption(
  'graphNodeUrl',
  'GRAPH_NODE_URL',
  defaultValues.ethereumStorage.ethereum.graphNodeUrl,
);

export function getGasPriceMin(): BigNumber | undefined {
  const gasPriceMin = getOption(
    'gasPriceMin',
    'GAS_PRICE_MIN',
    defaultValues.ethereumStorage.ethereum.gasPriceMin,
  );
  return gasPriceMin ? BigNumber.from(gasPriceMin) : undefined;
}

/**
 * Get the number of block confirmations to wait before considering a transaction successful
 */
export const getBlockConfirmations = makeOption(
  'blockConfirmations',
  'BLOCK_CONFIRMATIONS',
  defaultValues.ethereumStorage.ethereum.blockConfirmations,
);

/**
 * Get host from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the host of the IPFS gateway
 */
export const getIpfsHost = makeOption(
  'ipfsHost',
  'IPFS_HOST',
  defaultValues.ethereumStorage.ipfs.host,
);

/**
 * Get port from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the port of the IPFS gateway
 */
export const getIpfsPort = makeOption(
  'ipfsPort',
  'IPFS_PORT',
  defaultValues.ethereumStorage.ipfs.port,
);

/**
 * Get protocol from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the protocol to connect to the IPFS gateway
 */
export const getIpfsProtocol = makeOption(
  'ipfsProtocol',
  'IPFS_PROTOCOL',
  defaultValues.ethereumStorage.ipfs.protocol,
);

/**
 * Get the timeout threshold from command line argument, environment variables or default values for IPFS gateway connection
 * If the connection delay for IPFS gateway reachs this value, the connection fails
 * @returns the timeout threshold for IPFS gateway connection
 */
export const getIpfsTimeout = makeOption(
  'ipfsTimeout',
  'IPFS_TIMEOUT',
  defaultValues.ethereumStorage.ipfs.timeout,
);

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

/** logLevel is the maximum level of messages we will log */
export const getLogLevel = (): LogTypes.LogLevel => {
  const logLevelStr = getOption<keyof typeof LogTypes.LogLevel>('logLevel', 'LOG_LEVEL');
  return LogTypes.LogLevel[logLevelStr] || defaultValues.log.level;
};

/** logMode defines the log format to display: `human` is a more readable log, `machine` is better for parsing */
export const getLogMode = makeOption('logMode', 'LOG_MODE', defaultValues.log.mode);

/**
 * Get the minimum delay between getLastBlockNumber calls
 *
 * @returns the minimum delay between last block number fetches
 */
export const getLastBlockNumberDelay = makeOption(
  'lastBlockNumberDelay',
  'LAST_BLOCK_NUMBER_DELAY',
  defaultValues.ethereumStorage.lastBlockNumberDelay,
);

/**
 * Get the number of concurrent calls the ethereum storage can make
 *
 * @returns the maximum concurrency number
 */
export const getStorageConcurrency = makeOption(
  'storageMaxConcurrency',
  'STORAGE_MAX_CONCURRENCY',
  defaultValues.ethereumStorage.maxConcurrency,
);

/**
 * Get the delay between subsequent Ethereum call retries
 *
 * @returns the delay between call retries
 */
export const getEthereumRetryDelay = makeOption(
  'ethereumRetryDelay',
  'ETHEREUM_RETRY_DELAY',
  defaultValues.ethereumStorage.retryDelay,
);

/**
 * Get the initialization storage (a json-like file) path.
 * @returns the path to the json-like file that stores the initialization data (ethereum metadata and transaction index).
 */
export const getInitializationStorageFilePath = makeOption<string>(
  'initializationStorageFilePath',
  'INITIALIZATION_STORAGE_FILE_PATH',
);

/**
 * Get the delay to wait before sending a timeout when performing a persistTransaction request
 * persistTransaction is called when a request is created or updated and need to wait for Ethereum to commit the transaction
 * PROT-300: This configuration value can be removed once batching is implenented
 * because there will be no more need to wait for the smart contract
 * @returns THe delay to wait for the timeout
 */
export const getPersistTransactionTimeout = makeOption(
  'persistTransactionTimeout',
  'PERSIST_TRANSACTION_TIMEOUT',
  defaultValues.ethereumStorage.persistTransactionTimeout,
);

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
