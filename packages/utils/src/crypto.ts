import { MultiFormatTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import {
  decryptWithAes256cbc,
  decryptWithAes256gcm,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  random32Bytes,
} from './crypto/crypto-wrapper';
import {
  ecDecrypt,
  ecEncrypt,
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  ecRecover,
  ecSign,
} from './crypto/ec-utils';
import { deepSort } from './utils';

/**
 * manages crypto functions
 */
export {
  decryptWithAes256cbc,
  decryptWithAes256gcm,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  random32Bytes,
  ecDecrypt,
  ecEncrypt,
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  ecRecover,
  ecSign,
  generate32BufferKey,
  generate8randomBytes,
  keccak256Hash,
  last20bytesOfNormalizedKeccak256Hash,
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
function normalizeKeccak256Hash(data: unknown): MultiFormatTypes.HashTypes.IHash {
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
function normalize(data: unknown): string {
  if (data === undefined) {
    return 'undefined';
  }

  // deeply sort data keys
  const sortedData = deepSort(data);

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
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
}

/**
 * Hashes with the keccak256 algorithm with a normalization before and formats it
 *
 * @notice It will sort the object by keys before hashing
 *
 * @param data The data to hash
 * @returns The hashed data multi-formatted
 */
function last20bytesOfNormalizedKeccak256Hash(data: unknown): string {
  const hash = keccak256Hash(normalize(data));
  // eslint-disable-next-line no-magic-numbers
  return `0x${hash.slice(-40)}`;
}

/**
 * Generates a 32 bytes key in a base64 string
 *
 * @returns a random buffer of 32 bytes in a base64 string
 */
async function generate32BufferKey(): Promise<string> {
  return (await random32Bytes()).toString('base64');
}

/**
 * Generate 8 random bytes and return as a hexadecimal string.
 * Used for salt in ETH input data.
 * Example: 'ea3bc7caf64110ca'
 *
 * @returns a string of 8 random bytes
 */
async function generate8randomBytes(): Promise<string> {
  const random32BytesHex = await random32Bytes();
  return random32BytesHex.slice(0, 8).toString('hex');
}
