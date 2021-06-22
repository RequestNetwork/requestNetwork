import { StorageTypes } from '@requestnetwork/types';

import { BigNumber, utils } from 'ethers';

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
      [StorageTypes.GasPriceType.FAST]: 20,
      [StorageTypes.GasPriceType.STANDARD]: 10,
      [StorageTypes.GasPriceType.SAFELOW]: 2,
    }[type];
    return BigNumber.from(utils.parseUnits(basePrice.toString(), 'gwei'));
  }
}

export default XDaiFixedProvider;
