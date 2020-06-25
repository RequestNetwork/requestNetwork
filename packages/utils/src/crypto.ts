import { MultiFormatTypes } from '@requestnetwork/types';
import EthCrypto from 'eth-crypto';
import CryptoWrapper from './crypto/crypto-wrapper';
import EcUtils from './crypto/ec-utils';
import Utils from './utils';

/**
 * manages crypto functions
 */
export default {
  CryptoWrapper,
  EcUtils,
  generate32BufferKey,
  generate8randomBytes,
  keccak256Hash,
  normalize,
  normalizeKeccak256Hash,
};

/**
 * Hashes with the keccak256 algorithm with a normalization before and formats it
 *
 * @notice It will sort the object by keys before hashing
 *
 * @param data The data to hash
 * @returns The hashed data multi-formatted
 */
function normalizeKeccak256Hash(data: any): MultiFormatTypes.HashTypes.IHash {
  return {
    type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
    value: keccak256Hash(normalize(data)),
  };
}

/**
 * Normalizes data: sorts the object by keys and convert it in string
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
 * @returns The hashed data multi-formatted
 */
function keccak256Hash(data: string): string {
  return EthCrypto.hash.keccak256(data);
}

/**
 * Generates a 32 bytes key in a base64 string
 *
 * @returns a random buffer of 32 bytes in a base64 string
 */
async function generate32BufferKey(): Promise<string> {
  return (await CryptoWrapper.random32Bytes()).toString('base64');
}

// eslint-disable-next-line spellcheck/spell-checker
/**
 * Generate 8 random bytes and return as a hexadecimal string.
 * Used for salt in ETH input data.
 * Example: 'ea3bc7caf64110ca'
 *
 * @returns a string of 8 random bytes
 */
async function generate8randomBytes(): Promise<string> {
  const random32Bytes = await CryptoWrapper.random32Bytes();
  return random32Bytes.slice(0, 8).toString('hex');
}
