import { Storage as StorageTypes } from '@requestnetwork/types';
import { argv } from 'yargs';

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
      timeout: 10000,
    },
  },
  server: {
    port: 3000,
  },
  wallet: {
    mnemonic: 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
  },
};

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
  return process.env.MNEMONIC || defaultValues.wallet.mnemonic;
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
      SERVER OPTION
        port (${defaultValues.server.port})\t\t\t\tPort for the server to listen for API requests

      ETHEREUM OPTIONS
        networkId (${
          defaultValues.ethereumStorage.ethereum.networkId
        })\t\t\t\tId of the Ethereum network used
        providerUrl (${
          defaultValues.ethereumStorage.ethereum.web3ProviderUrl
        })\tUrl of the web3 provider for Ethereum

      IPFS OPTIONS
        ipfsHost (${defaultValues.ethereumStorage.ipfs.host})\t\t\tHost of the IPFS gateway
        ipfsPort (${defaultValues.ethereumStorage.ipfs.port})\t\t\t\tPort of the IPFS gateway
        ipfsProtocol (${
          defaultValues.ethereumStorage.ipfs.protocol
        })\t\t\tProtocol used to connect to the IPFS gateway
        ipfsTimeout (${
          defaultValues.ethereumStorage.ipfs.timeout
        })\t\t\tTimeout threshold to connect to the IPFS gateway

    EXAMPLE
      yarn start --port 5000 --networkId 1 --ipfsPort 6000

  All options are optional, not specified options are read from environment variables
  If the environment variable is not specified, default value is used

  Default mnemonic is:
  ${defaultValues.wallet.mnemonic}
`;

  return message;
}
