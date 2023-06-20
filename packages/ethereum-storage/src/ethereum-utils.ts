import { StorageTypes } from '@requestnetwork/types';
import * as config from './config';

/**
 * Collection of utils functions related to Ethereum Storage
 */

/**
 * Get the name of the Ethereum network from its id
 *
 * @param networkId Id of the network
 * @return name of the network
 */
export const getEthereumStorageNetworkNameFromId = (
  networkId: StorageTypes.EthereumNetwork,
): string => {
  const chainName = StorageTypes.EthereumNetwork[networkId];
  if (!chainName) {
    // this should never happen
    throw new Error(`Unsupported storage chain: ${networkId}`);
  }
  return chainName.toLowerCase();
};

export const getEthereumStorageNetworkIdFromName = (name: string): number | undefined => {
  const networkName = name.toUpperCase() as keyof typeof StorageTypes.EthereumNetwork;
  return StorageTypes.EthereumNetwork[networkName];
};

/**
 * Ensure the gas price returned by an API is safe to use
 * An API could return a high value if it's corrupted or if the format changes
 * The web3 provider would not in certain cases ask the user for confirmation
 * therefore we have to ensure the gas price is not too high
 *
 * @param gasPrice Value of the gas price
 * @returns True if the gas price can be used
 */
export const isGasPriceSafe = (gasPrice: bigint): boolean => {
  return gasPrice > (0) && gasPrice < BigInt(config.getSafeGasPriceLimit());
};
