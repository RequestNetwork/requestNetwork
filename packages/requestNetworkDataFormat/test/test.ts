import {expect} from 'chai';
import 'mocha';
import RequestNetworkDataFormat from '../src/index';

describe('Request Network Data Validator', () => {
    it('should valid a right json', () => {
      const dataJson = require('./data/example-valid.json');
      const result = RequestNetworkDataFormat.validate(dataJson);
      expect(result.valid, 'result.valid should be true').to.be.true;
    });

    it('should not valid a json without meta', () => {
      const dataJson = require('./data/example-no-meta.json');
      const result = RequestNetworkDataFormat.validate(dataJson);
      expect(result.valid, 'result.valid should be false').to.be.false;
      expect(result.errors[0].message, 'result.errors is wrong').to.equal('meta not found');
    });

    it('should not valid a json with meta unknown', () => {
      const dataJson = require('./data/example-meta-unknown.json');
      const result = RequestNetworkDataFormat.validate(dataJson);
      expect(result.valid, 'result.valid should be false').to.be.false;
      expect(result.errors[0].message, 'result.errors is wrong').to.equal('format not found');
    });

    it('should not valid a json with schema error', () => {
      const dataJson = require('./data/example-schema-errors.json');
      const result = RequestNetworkDataFormat.validate(dataJson);
      expect(result.valid, 'result.valid should be false').to.be.false;
      expect(result.errors[0].message, 'result.errors is wrong').to.equal('should match format "date-time"');
    });

    it('should not valid a json with required parameter missing', () => {
      const dataJson = require('./data/example-schema-missing.json');
      const result = RequestNetworkDataFormat.validate(dataJson);
      expect(result.valid, 'result.valid should be false').to.be.false;
      expect(result.errors[0].message, 'result.errors is wrong').to.equal(`should have required property \'name\'`);
    });
});
