import EthereumUtils from '../ethereum-utils';

import { StorageTypes } from '@requestnetwork/types';

import { toWei } from 'web3-utils';
import * as BigNumber from 'bn.js';

/**
 * Provide a fixed gas price for xDAI.
 */
export class XDaiFixedProvider implements StorageTypes.IGasPriceProvider {
  /**
   * @param type Type of the gas price (fast, standard or safe low)
   * @returns Requested gas price
   */
  public async getGasPrice(type: StorageTypes.GasPriceType): Promise<BigNumber | null> {
    const basePrice = {
      [StorageTypes.GasPriceType.FAST]: 10,
      [StorageTypes.GasPriceType.STANDARD]: 5,
      [StorageTypes.GasPriceType.SAFELOW]: 1,
    }[type];
    const price = toWei(new BigNumber(basePrice), 'gwei');

    if (!EthereumUtils.isGasPriceSafe(price)) {
      throw Error(`EthGasStation provided gas price not safe to use: ${price}`);
    }

    return price;
  }
}

export default XDaiFixedProvider;
