import * as yargs from 'yargs';
import { config } from 'dotenv';
import { BigNumber } from 'ethers';

import { LogTypes } from '@requestnetwork/types';

import { LogMode } from './logger';

const argv = yargs.option('help', { alias: 'h', type: 'boolean' }).parseSync();

// Load environment variables from .env file (without overriding variables already set)
config();

/**
 * This contains default values used for the server and storage initialization
 * when environment variable is not specified
 */
const defaultValues = {
  storage: {
    ethereum: {
      networkId: 0,
      web3ProviderUrl: 'http://localhost:8545',
      gasPriceMin: '1000000000', // 1 gwei per gas
      gasPriceMax: '1000000000000', // 1000 gwei per gas
      // multiply by 2 the estimated max fee per gas to accomadate for volatility
      gasPriceMultiplier: '200',
      blockConfirmations: 2,
    },
    ipfs: {
      url: 'http://localhost:5001',
      timeout: 30000,
    },
    thegraph: {
      nodeUrl: 'http://localhost:8000/subgraphs/name/RequestNetwork/request-storage',
    },
    persistTransactionTimeout: 600,
  },
  log: {
    level: LogTypes.LogLevel.INFO,
    mode: LogMode.human,
  },
  server: {
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

export const isHelp = (): boolean => argv.help || false;

/**
 * Get the port from command line argument, environment variables or default values to allow user to connect to the server
 */
export const getServerPort = makeOption('port', 'PORT', defaultValues.server.port);

/**
 * Get network id of the Ethereum network from command line argument, environment variables or default values
 */
export const getStorageNetworkId = makeOption(
  'networkId',
  'ETHEREUM_NETWORK_ID',
  defaultValues.storage.ethereum.networkId,
);

/**
 * Get Web3 provider url from command line argument, environment variables or default values
 */
export const getStorageWeb3ProviderUrl = makeOption(
  'providerUrl',
  'WEB3_PROVIDER_URL',
  defaultValues.storage.ethereum.web3ProviderUrl,
);

/** Get the Graph node URL */
export const getGraphNodeUrl = makeOption(
  'graphNodeUrl',
  'GRAPH_NODE_URL',
  defaultValues.storage.thegraph.nodeUrl,
);

export function getGasPriceMin(): BigNumber | undefined {
  const gasPriceMin = getOption(
    'gasPriceMin',
    'GAS_PRICE_MIN',
    defaultValues.storage.ethereum.gasPriceMin,
  );
  return gasPriceMin ? BigNumber.from(gasPriceMin) : undefined;
}

export function getGasPriceMax(): BigNumber | undefined {
  const gasPriceMax = getOption(
    'gasPriceMax',
    'GAS_PRICE_MAX',
    defaultValues.storage.ethereum.gasPriceMax,
  );
  return gasPriceMax ? BigNumber.from(gasPriceMax) : undefined;
}

export function getGasPriceMultiplier(): BigNumber | undefined {
  const gasPriceMultiplier = getOption(
    'gasPriceMultiplier',
    'GAS_PRICE_MULTIPLIER',
    defaultValues.storage.ethereum.gasPriceMultiplier,
  );
  return gasPriceMultiplier ? BigNumber.from(gasPriceMultiplier) : undefined;
}

/**
 * Get the number of block confirmations to wait before considering a transaction successful
 */
export const getBlockConfirmations = makeOption(
  'blockConfirmations',
  'BLOCK_CONFIRMATIONS',
  defaultValues.storage.ethereum.blockConfirmations,
);

/**
 * Get IPFS url from command line argument, environment variables or default values to connect to IPFS gateway
 * @returns the url of the IPFS gateway
 */
export const getIpfsUrl = makeOption('ipfsUrl', 'IPFS_URL', defaultValues.storage.ipfs.url);

/**
 * Get the timeout threshold from command line argument, environment variables or default values for IPFS gateway connection
 * If the connection delay for IPFS gateway reachs this value, the connection fails
 * @returns the timeout threshold for IPFS gateway connection
 */
export const getIpfsTimeout = makeOption(
  'ipfsTimeout',
  'IPFS_TIMEOUT',
  defaultValues.storage.ipfs.timeout,
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
 * Get the delay to wait before sending a timeout when performing a persistTransaction request
 * persistTransaction is called when a request is created or updated and need to wait for Ethereum to commit the transaction
 * PROT-300: This configuration value can be removed once batching is implenented
 * because there will be no more need to wait for the smart contract
 * @returns THe delay to wait for the timeout
 */
export const getPersistTransactionTimeout = makeOption(
  'persistTransactionTimeout',
  'PERSIST_TRANSACTION_TIMEOUT',
  defaultValues.storage.persistTransactionTimeout,
);

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
        headers (${
          defaultValues.server.headers
        })\t\t\t\tCustom headers to send with the API responses

      THE GRAPH OPTIONS
        graphNodeUrl (${defaultValues.storage.thegraph.nodeUrl})\t\t\t\tURL of the Graph node

      ETHEREUM OPTIONS
        networkId (${
          defaultValues.storage.ethereum.networkId
        })\t\t\t\tId of the Ethereum network used
        providerUrl (${
          defaultValues.storage.ethereum.web3ProviderUrl
        })\tUrl of the web3 provider for Ethereum
        gasPriceMin (${
          defaultValues.storage.ethereum.gasPriceMin
        })\t\t\t\tMinimum value for maxPriorityFeePerGas and maxFeePerGas
        gasPriceMax (${
          defaultValues.storage.ethereum.gasPriceMax
        })\t\t\t\tMaximum value for maxFeePerGas
        gasPriceMultiplier (${
          defaultValues.storage.ethereum.gasPriceMultiplier
        })\t\t\t\tMultiplier for the computed maxFeePerGas
        blockConfirmations (${
          defaultValues.storage.ethereum.blockConfirmations
        })\t\t\t\tNumber of block confirmations to wait before considering a transaction successful

      IPFS OPTIONS
        ipfsUrl (${defaultValues.storage.ipfs.url})\t\t\tURL of the IPFS gateway
        ipfsTimeout (${
          defaultValues.storage.ipfs.timeout
        })\t\t\tTimeout threshold to connect to the IPFS gateway

      OTHER OPTIONS
        logLevel (${
          LogTypes.LogLevel[defaultValues.log.level]
        })\t\t\tThe node log level (ERROR, WARN, INFO or DEBUG)
        logMode (${defaultValues.log.mode})\t\t\tThe node log mode (human or machine)

    EXAMPLE
      yarn start --port 5000 --networkId 1

  All options are optional, not specified options are read from environment variables
  If the environment variable is not specified, default value is used

  Default mnemonic is:
  ${defaultValues.wallet.mnemonic}
`;

  return message;
}

export const getConfigDisplay = (): string => {
  return `Using config:
  Ethereum network id: ${getStorageNetworkId()}
  Log Level: ${LogTypes.LogLevel[getLogLevel()]}
  Log Mode: ${getLogMode()}
  Web3 provider url: ${getStorageWeb3ProviderUrl()}
  TheGraph url: ${getGraphNodeUrl()}
  IPFS url: ${getIpfsUrl()}
  IPFS timeout: ${getIpfsTimeout()}
  Storage block confirmations: ${getBlockConfirmations()}
`;
};
