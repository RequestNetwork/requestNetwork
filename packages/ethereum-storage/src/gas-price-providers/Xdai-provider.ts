import { StorageTypes } from '@requestnetwork/types';
import * as BigNumber from 'bn.js';
// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER: number = 10000000000;
/**
 *  Assigns the xDai transactions gas price statically.
 * Cf. https://challenge.xdaichain.com/cost-estimates
 * for future possiblities , we are keeping this in line with other providers
 * thus there will be dummy API endpoints for keeping consistency
 */
<<<<<<< HEAD
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
=======
export default class XdaiGasPriceProvider implements StorageTypes.IGasPriceProvider {
    // @param  type : based on the type selected in the given level of txn payment , it will assign the gas to the GasDefinerFunction.
    public async getGasPrice(type: StorageTypes.GasPriceType): Promise<BigNumber> {
        let fixedGasPrice: BigNumber;
        const baseInt: number = 10;
        // switch case for choosing the txn type.
        switch (type) {

            case StorageTypes.GasPriceType.FAST:
                {   // for removing lint errors
                    const maxXdaifees: number = 10;
                    fixedGasPrice = new BigNumber(maxXdaifees, baseInt);
                    break;
                }
            case StorageTypes.GasPriceType.STANDARD:
                {
                    fixedGasPrice = new BigNumber(5, baseInt);
                    break;
                }

            case StorageTypes.GasPriceType.SAFELOW:
                {
                    fixedGasPrice = new BigNumber(1, baseInt);
                    break;
                }
            default:
                {
                    fixedGasPrice = new BigNumber(5, baseInt);
                }

        }
        return fixedGasPrice.mul(new BigNumber(API_MULTIPLIER));
>>>>>>> 9819a433163bbd584a8d3340e32737a30d32c5e1
    }
    return fixedGasPrice;
  }
}
