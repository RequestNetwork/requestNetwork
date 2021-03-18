import { StorageTypes } from '@requestnetwork/types';
const bigNumber: any = require('bn.js');
// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER: number = 10000000000;

/**
 *  Assigns the xDai transactions gas price statically.
 * Cf. https://challenge.xdaichain.com/cost-estimates
 */
export default class XdaiGasPriceProvider implements StorageTypes.IGasPriceProvider {
    // @param  type : based on the type selected in the given level of txn payment , it will assign the gas to the GasDefinerFunction.
    public async getGasPrice(type: StorageTypes.GasPriceType): Promise<typeof bigNumber | null> {
        let fixedGasPrice: typeof bigNumber;
        const baseInt: number = 10;
        // switch case for choosing the txn type.
        switch (type) {

            case StorageTypes.GasPriceType.FAST:
                {   // for removing lint errors
                    const maxXdaifees: number = 10;
                    fixedGasPrice = new bigNumber(maxXdaifees, baseInt);
                    break;
                }
            case StorageTypes.GasPriceType.STANDARD:
                {
                    fixedGasPrice = new bigNumber(5, baseInt);
                    break;
                }

            case StorageTypes.GasPriceType.SAFELOW:
                {
                    fixedGasPrice = new bigNumber(1, baseInt);
                    break;
                }
            default:
                {
                    fixedGasPrice = new bigNumber(5, baseInt);
                }

        }
        return (fixedGasPrice * API_MULTIPLIER);
    }
}