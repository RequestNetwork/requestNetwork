import DataFormat from '../src/index';

// tslint:disable:no-unused-expression
describe('Request Network Data Validator', () => {
  it('should validate a correct invoice 0.0.1 format', async () => {
    const dataJson = require('./data/example-valid-0.0.1.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be true'
    expect(result.valid).toBe(true);
  });

  it('should validate a correct invoice 0.0.2 format', () => {
    const dataJson = require('./data/example-valid-0.0.2.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be true'
    expect(result.valid).toBe(true);
  });

  it('should not validate an invalid invoice 0.0.2 format', () => {
    const dataJson = require('./data/example-invalid-0.0.2.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe('should be string');
  });

  it('should not validate a json without meta', () => {
    const dataJson = require('./data/example-no-meta.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe('meta not found');
  });

  it('should not validate a json with meta unknown', () => {
    const dataJson = require('./data/example-meta-unknown.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe('format not found');
  });

  it('should not validate a json with schema error', () => {
    const dataJson = require('./data/example-schema-errors.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe('should match format "date-time"');
  });

  it('should not validate a json with required parameter missing', () => {
    const dataJson = require('./data/example-schema-missing.json');
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe(`should have required property \'name\'`);
  });

  it('should not validate a json with meta.format missing', () => {
    const dataJson = { meta: {} };
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe('meta.format not found');
  });

  it('should not validate a json with meta.version missing', () => {
    const dataJson = { meta: { format: 'rnf_invoice' } };
    const result = DataFormat.validate(dataJson);
    // 'result.valid should be false'
    expect(result.valid).toBe(false);
    // 'result.errors is wrong'
    expect(result.errors[0].message).toBe('meta.version not found');
  });

  it('should not know a json with meta.format unknown', () => {
    const dataJson = { meta: { format: 'rnf-unknown' } };
    // 'should be false'
    expect(DataFormat.isKnownFormat(dataJson)).toBe(false);
  });

  it('should know a valid json', () => {
    const dataJson = require('./data/example-valid-0.0.1.json');
    // 'should be true'
    expect(DataFormat.isKnownFormat(dataJson)).toBe(true);
  });

  it('should not know an unvalid json but with format known', () => {
    const dataJson = { meta: { format: 'rnf_invoice' } };
    // 'should be true'
    expect(DataFormat.isKnownFormat(dataJson)).toBe(true);
  });
});
