import { IdentityTypes, MultiFormatTypes } from '@requestnetwork/types';

import HexadecimalSerializableMultiFormat from '../hexadecimal-serializable-multi-format';

const ethereumSmartContractSerializedRegex = /^21[0-9a-fA-F]{40}(\-[a-zA-Z]+)?$/;

/**
 * Class to serialize and deserialize multi-format identity ethereum address
 */
export default class EthereumSmartcontractMultiFormat extends HexadecimalSerializableMultiFormat {
  constructor() {
    super(
      MultiFormatTypes.prefix.IDENTITY_SMARTCONTRACT_ADDRESS,
      IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
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
      ethereumSmartContractSerializedRegex.test(formatted)
    );
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
    return `${this.prefix}${data.value.slice(2).toLowerCase()}${
      data.extra && data.extra.network ? `-${data.extra.network}` : ''
    }`;
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

    const valueWithoutPrefix = this.removePrefix(formatted.toLowerCase());

    // if a network is given
    if (valueWithoutPrefix.includes('-')) {
      const split = valueWithoutPrefix.split('-');
      return {
        extra: {
          network: split[1],
        },
        type: this.type,
        // replace the prefix by '0x'
        value: `0x${split[0]}`,
      };
    } else {
      return {
        type: this.type,
        // replace the prefix by '0x'
        value: `0x${valueWithoutPrefix}`,
      };
    }
  }
}
