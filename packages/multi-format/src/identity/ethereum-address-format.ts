import { IdentityTypes, MultiFormatTypes } from '@requestnetwork/types';

import { HexadecimalSerializableMultiFormat } from '../hexadecimal-serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format identity ethereum address
 */
export class EthereumAddressMultiFormat extends HexadecimalSerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.IDENTITY_ETHEREUM_ADDRESS, IdentityTypes.TYPE.ETHEREUM_ADDRESS);
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
      data.value.length === MultiFormatTypes.FORMAT_IDENTITY_ETHEREUM_ADDRESS_LENGTH
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
      formatted.length === MultiFormatTypes.FORMAT_IDENTITY_ETHEREUM_ADDRESS_LENGTH
    );
  }
}
