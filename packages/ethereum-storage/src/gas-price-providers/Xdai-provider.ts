import { StorageTypes } from '@requestnetwork/types';
const bigNumber: any = require('bn.js');
// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER: number = 10000000000;
/**
 *  Assigns the xDai transactions gas price statically.
 * Cf. https://challenge.xdaichain.com/cost-estimates
 * for future possiblities , we are keeping this in line with other providers
 * thus there will be dummy API endpoints for keeping consistency
 */
export default class XdaiGasPriceProvider
  implements StorageTypes.IGasPriceProvider {
  public async getGasPrice(
    type: StorageTypes.GasPriceType
  ): Promise<typeof bigNumber | null | string> {
    let fixedGasPrice: typeof bigNumber;
    // switch case for choosing the txn type.
    switch (type) {
      case StorageTypes.GasPriceType.FAST: {
        // for removing lint errors
        const maxFees   = 10
        fixedGasPrice = new bigNumber( maxFees * API_MULTIPLIER);
        break;
      }
      case StorageTypes.GasPriceType.STANDARD: {
        fixedGasPrice = new bigNumber(5 * API_MULTIPLIER);
        break;
      }

      case StorageTypes.GasPriceType.SAFELOW: {
        fixedGasPrice = new bigNumber(1 * API_MULTIPLIER);
        break;
      }
      default: {
        fixedGasPrice = new bigNumber(5 * API_MULTIPLIER);
      }
    }
    return fixedGasPrice;
  }
}
