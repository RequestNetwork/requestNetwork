import { MultiFormatTypes } from '@requestnetwork/types';

import encryptionFormats from './encryption/encryption-format';
import GroupMultiFormat from './group-multi-format';
import hashFormat from './hash/hash-format';
import identityFormat from './identity/identity-format';
import plainFormat from './plain/plain-format';

/** Serializes and deserializes any multi-format supported */
export default {
  deserialize,
  encryptionFormats,
  hashFormat,
  identityFormat,
  plainFormat,
  serialize,
};

/** List of the groups of formats available */
const availableFormats: GroupMultiFormat[] = [
  encryptionFormats,
  identityFormat,
  hashFormat,
  plainFormat,
];

/**
 * Deserializes any supported serialized string
 *
 * @param formatted the string to deserialize
 * @returns the deserialized object or throw
 */
function deserialize(formatted: string): MultiFormatTypes.IMultiFormatDeserialized {
  const matchingFormat = availableFormats.find(format => format.isDeserializableString(formatted));

  if (matchingFormat) {
    return matchingFormat.deserialize(formatted);
  }

  throw new Error('No format found to deserialize this string');
}

/**
 * Serializes any supported serializable object
 *
 * @param data the object to serialize
 * @returns the serialized string or throw.
 */
function serialize(data: MultiFormatTypes.IMultiFormatDeserialized): string {
  const matchingFormat = availableFormats.find(format => format.isSerializableObject(data));

  if (matchingFormat) {
    return matchingFormat.serialize(data);
  }

  throw new Error('No format found to serialize this object');
}
