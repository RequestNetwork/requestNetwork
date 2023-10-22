import { CurrencyTypes, StorageTypes } from '@requestnetwork/types';
import * as config from './config.js';

import { BigNumber } from 'ethers';
import { EvmChains } from '@requestnetwork/currency';

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
): CurrencyTypes.EvmChainName => {
  const chainName = EvmChains.getChainName(networkId);
  if (!chainName) {
    // this should never happen
    throw new Error(`Unsupported storage chain: ${networkId}`);
  }
  return chainName;
};

export const getEthereumStorageNetworkIdFromName = (
  name: CurrencyTypes.EvmChainName,
): number | undefined => {
  const networkId = EvmChains.getChainId(name);
  return Object.values(StorageTypes.EthereumNetwork).includes(networkId) ? networkId : undefined;
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
export const isGasPriceSafe = (gasPrice: BigNumber): boolean => {
  return gasPrice.gt(0) && gasPrice.lt(config.getSafeGasPriceLimit());
};
