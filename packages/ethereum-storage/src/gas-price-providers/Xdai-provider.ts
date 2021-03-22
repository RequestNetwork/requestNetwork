import { StorageTypes } from '@requestnetwork/types';
import * as BigNumber from 'bn.js';
// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER: number = 10000000000;
/**
 *  Assigns the xDai transactions gas price statically.
 * Cf. https://challenge.xdaichain.com/cost-estimates
 * for future possiblities , we are keeping this in line with other providers
 * thus there will be dummy API endpoints for keeping consistency
 *  @param  type : based on the type selected in the given level of txn payment , it will assign the gas to the GasDefinerFunction.
 */
export default class xdaiGasPriceProvider implements StorageTypes.IGasPriceProvider {
  public async getGasPrice(type: StorageTypes.GasPriceType): Promise<BigNumber> {
    let fixedGasPrice: BigNumber;
    const baseInt: number = 10;
    switch (type) {
      case StorageTypes.GasPriceType.FAST: {
        const maxXdaifees: number = 10;
        fixedGasPrice = new BigNumber(maxXdaifees, baseInt);
        break;
      }
      case StorageTypes.GasPriceType.STANDARD: {
        fixedGasPrice = new BigNumber(5, baseInt);
        break;
      }

      case StorageTypes.GasPriceType.SAFELOW: {
        fixedGasPrice = new BigNumber(1, baseInt);
        break;
      }
      default: {
        fixedGasPrice = new BigNumber(5, baseInt);
      }
    }
    return fixedGasPrice.mul(new BigNumber(API_MULTIPLIER));
  }
}
