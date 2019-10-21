import { MultiFormatTypes } from '@requestnetwork/types';

/**
 * Class to serialize and deserialize multi-format data
 * This class is meant to be inherited by all the multi-format
 */
export default class SerializableMultiFormat {
  protected prefix: string;
  protected type: any;

  constructor(prefix: string, type: any) {
    this.prefix = prefix;
    this.type = type;
  }

  /**
   * Checks if an object is a deserialized multi-format
   *
   * @param data object to check
   * @returns true if the data is a deserialized multi-format
   */
  public isSerializableObject(data: MultiFormatTypes.IMultiFormatDeserialized): boolean {
    return data.type === this.type && !!data.value;
  }

  /**
   * Checks if a string is a serialized multi-format
   *
   * @param data string to check
   * @returns true if the data is a serialized multi-format
   */
  public isDeserializableString(formattedData: string): boolean {
    return formattedData.slice(0, 2) === this.prefix;
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

    return `${this.prefix}${data.value}`;
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
      value: this.removePrefix(formatted),
    };
  }

  /**
   * Removes prefix of a multi-format
   *
   * @param formattedData the formatted multi-format
   * @returns the hash without the multi-format prefix
   */
  protected removePrefix(formattedData: string): string {
    return formattedData.slice(2);
  }
}
