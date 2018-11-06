import EthCrypto from 'eth-crypto';
import ecutils from './crypto/ECUtils';
import Utils from './utils';

/**
 * Function to manage Elliptic-curve cryptography
 */
export default {
  ecutils,
  normalizeKeccak256Hash,
};

/**
 * Function to hash with the keccak256 algorithm
 *
 * @notice it will sort the object by keys before hashing
 *
 * @param any   data   The data to hash
 *
 * @returns string  the data hashed
 */
function normalizeKeccak256Hash(data: any): string {
  // deeply sort data keys
  const dataSorted: any = Utils.deepSort(data);

  // convert to string and lowerCase it to not be case sensitive (e.g: avoid ethereum address case)
  const dataCleaned = JSON.stringify(dataSorted).toLowerCase();
  return EthCrypto.hash.keccak256(dataCleaned);
}
