import { Storage as StorageTypes } from '@requestnetwork/types';

/**
 * This contains default values used for the server and storage initialization
 * when environment variable is not specified
 */
const defaultValues: any = {
  ethereumStorage: {
    ethereum: {
      networkId: 0,
      web3ProviderHost: 'http://localhost:8545',
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
 * Get the port from environment variables or default values to allow user to connect to the server
 * @returns the port to listen to connection on the server
 */
export function getServerPort(): number {
  return process.env.PORT ? Number(process.env.PORT) : defaultValues.server.port;
}

/**
 * Get network id of Ethereum from environment variables or default values
 * @returns Ethereum network id
 */
export function getStorageNetworkId(): number {
  return process.env.ETHEREUM_NETWORK_ID
    ? Number(process.env.ETHEREUM_NETWORK_ID)
    : defaultValues.ethereumStorage.ethereum.providerHost;
}

/**
 * Get Web3 provider host from environment variables or default values
 * @returns Web3 provider host
 */
export function getStorageWeb3ProviderHost(): string {
  return process.env.ETHEREUM_PROVIDER_HOST || defaultValues.ethereumStorage.ethereum.web3ProviderHost;
}

/**
 * Get host from environment variables or default values to connect to IPFS gateway
 * @returns the host of the IPFS gateway
 */
export function getIpfsHost(): string {
  return process.env.IPFS_HOST || defaultValues.ethereumStorage.ipfs.host;
}

/**
 * Get port from environment variables or default values to connect to IPFS gateway
 * @returns the port of the IPFS gateway
 */
export function getIpfsPort(): number {
  return process.env.IPFS_PORT
    ? Number(process.env.IPFS_PORT)
    : defaultValues.ethereumStorage.ipfs.port;
}

/**
 * Get protocol from environment variables or default values to connect to IPFS gateway
 * @returns the protocol to connect to the IPFS gateway
 */
export function getIpfsProtocol(): StorageTypes.IpfsGatewayProtocol {
  return process.env.IPFS_PROTOCOL || defaultValues.ethereumStorage.ipfs.protocol;
}

/**
 * Get the timeout threshold from environment variables or default values for IPFS gateway connection
 * If the connection delay for IPFS gateway reachs this value, the connection fails
 * @returns the timeout threshold for IPFS gateway connection
 */
export function getIpfsTimeout(): number {
  return process.env.IPFS_TIMEOUT
    ? Number(process.env.IPFS_TIMEOUT)
    : defaultValues.ethereumStorage.ipfs.timeout;
}

/**
 * Get the mnemonic to generate the private key for the wallet
 * The default value must only be used for test purposes
 * For production, mnemonic should always be provided as environment variable
 * @returns the mnemonic for HDWallet
 */
export function getMnemonic(): string {
  return process.env.MNEMONIC
    ? process.env.MNEMONIC
    : defaultValues.wallet.mnemonic;
}
