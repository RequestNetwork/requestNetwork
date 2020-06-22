import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import SerializableMultiFormat from '../serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format AES-256-GCM encrypted data
 */
export default class Aes256GcmMultiFormat extends SerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED, EncryptionTypes.METHOD.AES256_GCM);
  }
}
