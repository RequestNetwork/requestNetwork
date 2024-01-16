import { MultiFormatTypes } from '@requestnetwork/types';

import { encryptionFormats } from './encryption/encryption-format';
import { MultiFormatGroup } from './multi-format-group';
import { hashFormat } from './hash/hash-format';
import { identityFormat } from './identity/identity-format';
import { plainFormat } from './plain/plain-format';

export { encryptionFormats, MultiFormatGroup, hashFormat, identityFormat, plainFormat };

/** List of the groups of formats available */
const availableFormats: MultiFormatGroup[] = [
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
export function deserialize(formatted: string): MultiFormatTypes.IMultiFormatDeserialized {
  const matchingFormat = availableFormats.find((format) =>
    format.isDeserializableString(formatted),
  );

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
export function serialize(data: MultiFormatTypes.IMultiFormatDeserialized): string {
  const matchingFormat = availableFormats.find((format) => format.isSerializableObject(data));

  if (matchingFormat) {
    return matchingFormat.serialize(data);
  }

  throw new Error('No format found to serialize this object');
}
