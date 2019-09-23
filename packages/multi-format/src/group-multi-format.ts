import { MultiFormatTypes } from '@requestnetwork/types';

import SerializableMultiFormat from './serializable-multi-format';

/**
 * Class to group multi-formats to make the code more maintainable (see index.ts)
 */
export default class GroupMultiFormat {
  /** All the format in the group */
  private availableFormats: SerializableMultiFormat[] = [];

  /**
   * Creates an instance of GroupMultiFormat.
   *
   * @param formats all the formats of this group
   */
  constructor(formats: SerializableMultiFormat[]) {
    this.availableFormats = formats;
  }

  /**
   * Checks if an object is a deserialized multi-format of this group
   *
   * @param data object to check
   * @returns true if the data is a deserialized multi-format of this group
   */
  public isSerializableObject(data: MultiFormatTypes.IMultiFormatDeserialized): boolean {
    // check if one of the format of the group can handle the data
    return this.availableFormats.some(format => format.isSerializableObject(data));
  }

  /**
   * Checks if a string is a serialized multi-format of this group
   *
   * @param formatted string to check
   * @returns true if the data is a serialized multi-format
   */
  public isDeserializableString(formatted: string): boolean {
    // check if one of the format of the group can handle the string
    return this.availableFormats.some(format => format.isDeserializableString(formatted));
  }

  /**
   * Serializes a deserialized multi-format of this group
   *
   * @param data object to serialize
   * @returns the data as a serialized multi-format
   */
  public serialize(data: MultiFormatTypes.IMultiFormatDeserialized): string {
    // Find the format that can handle the data
    const matchingFormat = this.availableFormats.find(format => format.isSerializableObject(data));

    // if found, serialize with the right format
    if (matchingFormat) {
      return matchingFormat.serialize(data);
    }

    throw new Error('No format found to serialize this object');
  }

  /**
   * Deserialized a multi-format string of this group
   *
   * @param data string to deserialized
   * @returns the data as a deserialized multi-format
   */
  public deserialize(formatted: string): MultiFormatTypes.IMultiFormatDeserialized {
    // Find the format that can handle the string
    const matchingFormat = this.availableFormats.find(format =>
      format.isDeserializableString(formatted),
    );

    // if found, deserialize with the right format
    if (matchingFormat) {
      return matchingFormat.deserialize(formatted);
    }

    throw new Error('No format found to deserialize this string');
  }
}
