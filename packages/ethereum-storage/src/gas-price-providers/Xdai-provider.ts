//import EthereumUtils from '../ethereum-utils';

import { StorageTypes } from '@requestnetwork/types';
//import Utils from '@requestnetwork/utils';

//import fetch from 'node-fetch';

const bigNumber: any = require('bn.js');


// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER: number = 1000000000;


/**
 * 
 * assigns the gas price based on the following : https://challenge.xdaichain.com/cost-estimates
 * no querying from the RPC endpoint regarding the gas pricing .
 * to be verified by YMA , VRO.
 */

export default class XdaiProvider implements StorageTypes.IGasPriceProvider {


/// in  current context , the cost will not be dependent on the API , but on the fixed price .
public async getGasPrice(type: StorageTypes.GasPriceType):Promise<typeof bigNumber> {

// there are no API endpoints for finding the dynamic price , there price is relatively constant 
// and slightly depends on the rate of transaction as  told in https://challenge.xdaichain.com/cost-estimates
// current 
//let FastGasPrice: Number = 20
//let ProposeGasPrice: Number = 10;
//let SafeGasPrice: Number = 5;

let GasPrice: any = [20,10,5];


const fixedGasPrice  = new bigNumber(
    parseInt(
    {
        [StorageTypes.GasPriceType.FAST] : GasPrice[0] ,
        [StorageTypes.GasPriceType.STANDARD] : GasPrice[1] ,
        [StorageTypes.GasPriceType.SAFELOW] : GasPrice[2] ,
    }[type], 
    10,
    ) *(API_MULTIPLIER) ,
    
);
// getting pricing  from gwei to wei


return fixedGasPrice;
}

}