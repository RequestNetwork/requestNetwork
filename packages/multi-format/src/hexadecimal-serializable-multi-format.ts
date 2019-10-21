import { MultiFormatTypes } from '@requestnetwork/types';

import SerializableMultiFormat from './serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format data using hexadecimal values
 * This class is meant to be inherited by all the multi-format using as value a hexadecimal (starting by '0x')
 */
export default class HexadecimalSerializableMultiFormat extends SerializableMultiFormat {
  /**
   * Checks if an object is a deserialized multi-format
   *
   * @param data object to check
   * @returns true if the data is a deserialized multi-format
   */
  public isSerializableObject(data: MultiFormatTypes.IMultiFormatDeserialized): boolean {
    return super.isSerializableObject(data) && data.value.slice(0, 2) === '0x';
  }

  /**
   * Checks if a string is a serialized multi-format
   *
   * @param formatted string to check
   * @returns true if the data is a serialized multi-format
   */
  public isDeserializableString(formatted: string): boolean {
    return super.isDeserializableString(formatted);
  }

  /**
   * Serializes a deserialized multi-format
   *
   * @param data object to serialize
   * @returns the data as a serialized multi-format
   */
  public serialize(data: MultiFormatTypes.IMultiFormatDeserialized): string {
    if (!this.isSerializableObject(data)) {
      throw new Error('object is not a serializable object');
    }

    // replace '0x' by the prefix
    return `${this.prefix}${data.value.slice(2).toLowerCase()}`;
  }

  /**
   * Deserialized a multi-format string
   *
   * @param data string to deserialized
   * @returns the data as a deserialized multi-format
   */
  public deserialize(formatted: string): MultiFormatTypes.IMultiFormatDeserialized {
    if (!this.isDeserializableString(formatted)) {
      throw new Error('string is not a serialized string');
    }

    return {
      type: this.type,
      // replace the prefix by '0x'
      value: `0x${this.removePrefix(formatted.toLowerCase())}`,
    };
  }
}
