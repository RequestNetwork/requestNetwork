// JSON Schema of an address
import * as schemaAddress from './format/address.json';

/* eslint-disable spellcheck/spell-checker */
// another json validation tool from https://github.com/epoberezkin/ajv
import * as AJV from 'ajv';
/* eslint-disable spellcheck/spell-checker */

export default {
  /**
   * validation of data
   * @param   data    object you want to validate
   * @return  object.valid == true if the json is valid, object.valid == false and object.errors otherwise.
   */
  validate(data: any): any {
    const validationTool = new AJV()
      .addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
      .addSchema(schemaAddress);

    // Check the meta information
    if (!data.meta) {
      return { valid: false, errors: [{ message: 'meta not found' }] };
    }
    if (!data.meta.format) {
      return { valid: false, errors: [{ message: 'meta.format not found' }] };
    }
    if (!data.meta.version) {
      return { valid: false, errors: [{ message: 'meta.version not found' }] };
    }

    // Try to retrieve the schema json
    let schema;
    try {
      schema = require(`./format/${data.meta.format}/${data.meta.format}-${
        data.meta.version
      }.json`);
    } catch (e) {
      return { valid: false, errors: [{ message: 'format not found' }] };
    }

    // Compile and Validate
    const validate = validationTool.compile(schema);
    const valid = validate(data);

    // If not valid return the error
    if (!valid) {
      return { valid: false, errors: validate.errors };
    }

    return { valid: true };
  },
};
