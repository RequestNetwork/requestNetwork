import { expect } from 'chai';
import DataFormat from '../src/index';

// tslint:disable:no-unused-expression
describe('Request Network Data Validator', () => {
  it('should validate a correct invoice 0.0.1 format', async () => {
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

  it('should not validate a json with meta.format missing', () => {
    const dataJson = { meta: {} };
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal('meta.format not found');
  });

  it('should not validate a json with meta.version missing', () => {
    const dataJson = { meta: { format: 'rnf_invoice' } };
    const result = DataFormat.validate(dataJson);
    expect(result.valid, 'result.valid should be false').to.be.false;
    expect(result.errors[0].message, 'result.errors is wrong').to.equal('meta.version not found');
  });

  it('should not know a json with meta.format unknown', () => {
    const dataJson = { meta: { format: 'rnf-unknown' } };
    expect(DataFormat.isKnownFormat(dataJson), 'should be false').to.be.false;
  });

  it('should know a valid json', () => {
    const dataJson = require('./data/example-valid-0.0.1.json');
    expect(DataFormat.isKnownFormat(dataJson), 'should be true').to.be.true;
  });

  it('should not know an unvalid json but with format known', () => {
    const dataJson = { meta: { format: 'rnf_invoice' } };
    expect(DataFormat.isKnownFormat(dataJson), 'should be true').to.be.true;
  });
});
