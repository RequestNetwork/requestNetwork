import { MultiFormatTypes } from '@requestnetwork/types';

import HexadecimalSerializableMultiFormat from '../hexadecimal-serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format AES-256-CBC encrypted data
 */
export default class EthereumAddressMultiFormat extends HexadecimalSerializableMultiFormat {
  constructor() {
    super(
      MultiFormatTypes.prefix.NORMALIZE_KECCAK256_HASH,
      MultiFormatTypes.HashTypes.TYPE.KECCAK256,
    );
  }

  /**
   * Checks if an object is a deserialized multi-format
   *
   * @param data object to check
   * @returns true if the data is a deserialized multi-format
   */
  public isSerializableObject(data: MultiFormatTypes.IMultiFormatDeserialized): boolean {
    return (
      super.isSerializableObject(data) &&
      data.value.length === MultiFormatTypes.FORMAT_NORMALIZE_KECCAK256_HASH_LENGTH
    );
  }

  /**
   * Checks if a string is a serialized multi-format
   *
   * @param formatted string to check
   * @returns true if the data is a serialized multi-format
   */
  public isDeserializableString(formatted: string): boolean {
    return (
      super.isDeserializableString(formatted) &&
      formatted.length === MultiFormatTypes.FORMAT_NORMALIZE_KECCAK256_HASH_LENGTH
    );
  }
}
