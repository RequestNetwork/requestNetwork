import { StorageTypes } from '@requestnetwork/types';
import * as config from './config';

const bigNumber: any = require('bn.js');

/**
 * Collection of utils functions related to Ethereum
 */
export default {
  /**
   * Get the name of the Ethereum network from its id
   *
   * @param networkId Id of the network
   * @return name of the network
   */
  getEthereumNetworkNameFromId(networkId: StorageTypes.EthereumNetwork): string {
    return {
      [StorageTypes.EthereumNetwork.PRIVATE as StorageTypes.EthereumNetwork]: 'private',
      [StorageTypes.EthereumNetwork.MAINNET as StorageTypes.EthereumNetwork]: 'mainnet',
      [StorageTypes.EthereumNetwork.KOVAN as StorageTypes.EthereumNetwork]: 'kovan',
      [StorageTypes.EthereumNetwork.RINKEBY as StorageTypes.EthereumNetwork]: 'rinkeby',
    }[networkId];
  },

  /**
   * Ensure the gas price returned by an API is safe to use
   * An API could return a high value if it's corrupted or if the format changes
   * The web3 provider would not in certain cases ask the user for confirmation
   * therefore we have to ensure the gas price is not too high
   *
   * @param gasPrice Value of the gas price
   * @returns True if the gas price can be used
   */
  isGasPriceSafe(gasPrice: typeof bigNumber): boolean {
    return (
      gasPrice.gt(new bigNumber(0)) && gasPrice.lt(new bigNumber(config.getSafeGasPriceLimit()))
    );
  },
};
