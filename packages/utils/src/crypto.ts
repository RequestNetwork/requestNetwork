import EthCrypto from 'eth-crypto';
import EcUtils from './crypto/ec-utils';
import Utils from './utils';

/**
 * manages crypto functions
 */
export default {
  EcUtils,
  keccak256Hash,
  normalize,
  normalizeKeccak256Hash,
};

/**
 * Hashes with the keccak256 algorithm with a normalization before
 *
 * @notice It will sort the object by keys before hashing
 *
 * @param data The data to hash
 * @returns The hashed data
 */
function normalizeKeccak256Hash(data: any): string {
  return keccak256Hash(normalize(data));
}

/**
 * Normalizes data: sorts the object by keys and convert it in hexadecimal string
 *
 * @param data The data to normalize
 * @returns The normalized data
 */
function normalize(data: any): string {
  if (data === undefined) {
    return 'undefined';
  }

  // deeply sort data keys
  const sortedData: any = Utils.deepSort(data);

  // convert to string and lowerCase it, to be case insensitive (e.g: avoid ethereum address casing checksum)
  return JSON.stringify(sortedData).toLowerCase();
}

/**
 * Hashes with the keccak256 algorithm
 *
 * @param data The string to hash
 * @returns The hashed data
 */
function keccak256Hash(data: string): string {
  return EthCrypto.hash.keccak256(data);
}
