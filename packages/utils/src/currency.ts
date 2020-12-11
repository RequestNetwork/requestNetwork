import { RequestLogicTypes } from '@requestnetwork/types';
import Crypto from './crypto';

/**
 * Function to manage amounts
 */
export default {
  getCurrencyHash,
};


/**
 * Function to check if the amount is valid (representation of a positive integer)
 *
 * @param currency
 *
 * @returns the hash of the currency
 */
function getCurrencyHash(currency: RequestLogicTypes.ICurrency): string {
  if(currency.type === RequestLogicTypes.CURRENCY.ERC20) {
    return currency.value;
  }
  if(currency.type === RequestLogicTypes.CURRENCY.ETH || currency.type === RequestLogicTypes.CURRENCY.BTC) {
    // ignore the network
    return Crypto.last20bytesOfNormalizedKeccak256Hash({type: currency.type, value: currency.value});;
  }
  return Crypto.last20bytesOfNormalizedKeccak256Hash(currency);
}
