// JSON Schema of an address 
const schemaAddress = require('./format/address.json');

// another json validator from https://github.com/epoberezkin/ajv
const Ajv = require('ajv');

/**
 * The RequestNetworkDataValidator class is to validate request data
 */
export default class RequestNetworkDataValidator {
    // another json validator
    private ajv: any;

    /**
     * constructor to Instantiates a new RequestNetworkDataValidator
     */
    constructor() {
        this.ajv = new Ajv().addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
                            .addSchema(schemaAddress);
    }

    /**
     * validation of data
     * @param   data    object you want to validate
     * @return  object.valid == true if the json is valid, object.valid == false and object.errors otherwise.
     */
    public validate(data: any): any {
        // Check the meta information
        if(!data.meta) return {valid:false, errors:[{message:'meta not found'}]};
        if(!data.meta.format) return {valid:false, errors:[{message:'meta.format not found'}]};
        if(!data.meta.version) return {valid:false, errors:[{message:'meta.version not found'}]};

        // Generate the path of the schema json
        const schemaPath = `./format/${data.meta.format}/${data.meta.format}-${data.meta.version}.json`

        // Try to retreive the schema json
        let schema;
        try {
            schema = require(schemaPath);
        } catch(e) {
            return {valid:false, errors:[{message:'format not found'}]};
        }

        // Compile and Validate
        var validate = this.ajv.compile(schema);
        var valid = validate(data);
        
        // If not valid return the error
        if (!valid) {
            return {valid:false, errors:validate.errors};
        }

        return {valid:true};
    }

}
