import { expect } from 'chai';
import 'mocha';
import DataFormat from '../src/index';

describe('Request Network Data Validator', () => {
  it('should validate a correct invoice 0.0.1 format', () => {
    const dataJson = require('./data/example-valid-0.0.1.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be true').to.be.true;
  });

  it('should validate a correct invoice 0.0.2 format', () => {
    const dataJson = require('./data/example-valid-0.0.2.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be true').to.be.true;
  });

  it('should not validate an invalid invoice 0.0.2 format', () => {
    const dataJson = require('./data/example-invalid-0.0.2.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal('should be string');
  });

  it('should not validate a json without meta', () => {
    const dataJson = require('./data/example-no-meta.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal('meta not found');
  });

  it('should not validate a json with meta unknown', () => {
    const dataJson = require('./data/example-meta-unknown.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal('format not found');
  });

  it('should not validate a json with schema error', () => {
    const dataJson = require('./data/example-schema-errors.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal(
      'should match format "date-time"',
    );
  });

  it('should not validate a json with required parameter missing', () => {
    const dataJson = require('./data/example-schema-missing.json');
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal(
      `should have required property \'name\'`,
    );
  });
});
