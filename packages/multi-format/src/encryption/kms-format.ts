import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import { SerializableMultiFormat } from '../serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format KMS encrypted data
 */
export class KMSMultiFormat extends SerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.KMS_ENCRYPTED, EncryptionTypes.METHOD.KMS);
  }
}
