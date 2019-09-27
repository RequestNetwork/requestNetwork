import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import SerializableMultiFormat from '../serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format AES-256-CBC encrypted data
 */
export default class ECIESMultiFormat extends SerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.ECIES_ENCRYPTED, EncryptionTypes.METHOD.ECIES);
  }
}
