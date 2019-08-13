import { MultiFormatTypes } from '@requestnetwork/types';

/**
 * Collection of function to format data
 */
export default {
  formatEciesEncryption,
  formatKeccak256Hash,
  formatPlainText,
  isEciesEncryption,
  isKeccak256Hash,
  isPlainText,
};

/**
 * Formats a plain text
 *
 * @param data data to format in plain text
 * @returns the data with the right prefix ('00')
 */
function formatPlainText(data: string): string {
  return `${MultiFormatTypes.prefix.PLAIN_TEXT}${data}`;
}

/**
 * Checks if a formatted data is a formatted plain text
 *
 * @param formattedData the formatted data to check
 * @returns true if follow the format, false otherwise
 */
function isPlainText(formattedData: string): boolean {
  return formattedData.slice(0, 2) === MultiFormatTypes.prefix.PLAIN_TEXT;
}

/**
 * transforms a keccak256 to a multi-format keccak256
 *
 * @param hash to format
 * @returns format the hash replacing the prefix '0x' by '01'
 */
function formatKeccak256Hash(hash: string): string {
  if (hash.length !== MultiFormatTypes.FORMAT_NORMALIZE_KECCAK256_HASH_LENGTH) {
    throw new Error('Hash must be a Keccak256 Hash');
  }
  return `${MultiFormatTypes.prefix.NORMALIZE_KECCAK256_HASH}${hash.slice(2)}`;
}

/**
 * Checks if a formatted data is a formatted normalized keccak256 hash
 *
 * @param formattedData the formatted data to check
 * @returns true if follow the format, false otherwise
 */
function isKeccak256Hash(formattedData: string): boolean {
  return (
    formattedData.slice(0, 2) === MultiFormatTypes.prefix.NORMALIZE_KECCAK256_HASH &&
    formattedData.length === MultiFormatTypes.FORMAT_NORMALIZE_KECCAK256_HASH_LENGTH
  );
}

/**
 * transforms an ECIES encrypted data to a multi-format
 *
 * @param encryptedData encrypted data to format
 * @returns format the encrypted data adding the prefix '02'
 */
function formatEciesEncryption(encryptedData: string): string {
  return `${MultiFormatTypes.prefix.ECIES_ENCRYPTED}${encryptedData}`;
}

/**
 * Checks if a formatted data is a formatted ECIES encryption
 *
 * @param formattedData the formatted data to check
 * @returns true if follow the format, false otherwise
 */
function isEciesEncryption(formattedData: string): boolean {
  return formattedData.slice(0, 2) === MultiFormatTypes.prefix.ECIES_ENCRYPTED;
}
