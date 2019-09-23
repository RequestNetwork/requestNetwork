import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import HexadecimalSerializableMultiFormat from '../hexadecimal-serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format AES-256-CBC encrypted data
 */
export default class ECIESMultiFormat extends HexadecimalSerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.ECIES_ENCRYPTED, EncryptionTypes.METHOD.ECIES);
  }
}
