import { MultiFormatTypes } from '@requestnetwork/types';

import { SerializableMultiFormat } from '../serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format plain text
 */
export class PlainTextMultiFormat extends SerializableMultiFormat {
  constructor() {
    super(MultiFormatTypes.prefix.PLAIN_TEXT, MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT);
  }
}
