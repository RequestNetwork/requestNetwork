
import { StorageTypes } from '@requestnetwork/types';
const bigNumber: any = require('bn.js');


// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER: number = 10000000000;

/**
 *  Assigns the xDai transactions gas price statically.
 * Cf. https://challenge.xdaichain.com/cost-estimates
 */
export default class XdaiGasPriceProvider implements StorageTypes.IGasPriceProvider {

    // @param  type : based on the type selected in the given context , it will assign the gas to the GasDefinerFunction.
    public async getGasPrice(type: StorageTypes.GasPriceType): Promise<typeof bigNumber | null> {
        var fixedGasPrice: typeof bigNumber;

        switch (type) {
            case StorageTypes.GasPriceType.FAST:
                {
                    fixedGasPrice = new bigNumber(10, 10);
                    break;
                }


            case StorageTypes.GasPriceType.STANDARD:
                {
                    fixedGasPrice = new bigNumber(5, 10);
                    break;

                }

            case StorageTypes.GasPriceType.SAFELOW:
                {
                    fixedGasPrice = new bigNumber(1, 10);
                    break;

                }


        }




        return (fixedGasPrice * API_MULTIPLIER);
    }

}