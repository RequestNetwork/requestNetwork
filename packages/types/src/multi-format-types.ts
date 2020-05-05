import * as HashTypes from './multi-format/hash-types';
import * as PlainTypes from './multi-format/plain-types';

export { HashTypes, PlainTypes };

/** Prefix of handled data format */
export enum prefix {
  PLAIN_TEXT = '00',
  /** the data is Keccak256 hash of normalized data (sorted object, stringify and lowercase) */
  NORMALIZE_KECCAK256_HASH = '01',
  /** ECIES encrypted data */
  ECIES_ENCRYPTED = '02',
  /** AES256-CBC encrypted data */
  AES256_CBC_ENCRYPTED = '03',

  /** Identity Ethereum address */
  IDENTITY_ETHEREUM_ADDRESS = '20',
  /** Identity smart contract address */
  IDENTITY_SMARTCONTRACT_ADDRESS = '21',
}

/** Interface of all the deserialized multi-format object */
export interface IMultiFormatDeserialized {
  // type of the data
  type: any;
  // the data itself
  value: string;
  // extra information
  extra?: any;
}

/** type of the serialized multi-format object */
export type MultiFormatSerialized = string;

/** Length of a formatted normalized Keccak256 hash (prefix + hash = 2 + 64 = 66) (no 0x expected) */
export const FORMAT_NORMALIZE_KECCAK256_HASH_LENGTH = 66;

/** Length of a formatted ethereum address identity (prefix + address = 2 + 40 = 42) (no 0x expected) */
export const FORMAT_IDENTITY_ETHEREUM_ADDRESS_LENGTH = 42;
