import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import SerializableMultiFormat from '../serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format AES-256-CBC encrypted data
 */
export default class Aes256CbcMultiFormat extends SerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.AES256_CBC_ENCRYPTED, EncryptionTypes.METHOD.AES256_CBC);
  }
}
