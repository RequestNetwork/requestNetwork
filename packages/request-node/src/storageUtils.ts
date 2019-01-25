import { EthereumStorage } from '@requestnetwork/ethereum-storage';
import { Storage as StorageTypes } from '@requestnetwork/types';
import * as config from './config';

const hdWalletProvider = require('truffle-hdwallet-provider');

/**
 * Get the ethereum storage with values from config
 * @param mnemonic: mnemonic for the web3 wallet
 * @returns ethereum storage object
 */
export function getEthereumStorage(mnemonic: string): EthereumStorage {
  // Initializes IPFS gateway connection object
  const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
    host: config.getIpfsHost(),
    port: config.getIpfsPort(),
    protocol: config.getIpfsProtocol(),
    timeout: config.getIpfsTimeout(),
  };

  // Initializes web3 connection object
  const provider = new hdWalletProvider(
    mnemonic,
    config.getStorageWeb3ProviderHost(),
  );

  const web3Connection: StorageTypes.IWeb3Connection = {
    networkId: config.getStorageNetworkId(),
    web3Provider: provider,
  };

  return new EthereumStorage(ipfsGatewayConnection, web3Connection);
}
