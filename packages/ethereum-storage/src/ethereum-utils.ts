import { StorageTypes } from '@requestnetwork/types';
import * as config from './config';

import { BigNumber } from 'ethers';

const networks = {
  [StorageTypes.EthereumNetwork.PRIVATE]: 'private',
  [StorageTypes.EthereumNetwork.MAINNET]: 'mainnet',
  [StorageTypes.EthereumNetwork.KOVAN]: 'kovan',
  [StorageTypes.EthereumNetwork.RINKEBY]: 'rinkeby',
  [StorageTypes.EthereumNetwork.GOERLI]: 'goerli',
  [StorageTypes.EthereumNetwork.SOKOL]: 'sokol',
  [StorageTypes.EthereumNetwork.XDAI]: 'xdai',
};

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
    return networks[networkId];
  },

  getEthereumIdFromNetworkName(name: string): StorageTypes.EthereumNetwork | undefined {
    const id = Object.entries(networks).find((entry) => entry[1] === name)?.[0];
    if (!id) {
      return undefined;
    }
    return Number(id) as StorageTypes.EthereumNetwork;
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
  isGasPriceSafe(gasPrice: BigNumber): boolean {
    return gasPrice.gt(0) && gasPrice.lt(config.getSafeGasPriceLimit());
  },
};
