/** Prefix of handled data format */
export enum prefix {
  PLAIN_TEXT = '00',
  /** the data is Keccak256 hash of normalized data (sorted object, stringify and lowercase) */
  NORMALIZE_KECCAK256_HASH = '01',
}

/** Length of a formatted normalized Keccak256 hash (prefix + hash = 2 + 64 = 66) (no 0x expected) */
export const FORMAT_NORMALIZE_KECCAK256_HASH_LENGTH = 66;
