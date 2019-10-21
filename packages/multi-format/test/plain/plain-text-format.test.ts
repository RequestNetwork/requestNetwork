import { MultiFormatTypes } from '@requestnetwork/types';
import { expect } from 'chai';
import 'mocha';

import PlainTextFormat from '../../src/plain/plain-text-format';

let plainTextFormat: PlainTextFormat;

/* tslint:disable:no-unused-expression */
describe('plain/plain-text-format', () => {
  beforeEach(() => {
    plainTextFormat = new PlainTextFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format is given', () => {
      expect(
        plainTextFormat.isDeserializableString('00this is a plain text'),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        plainTextFormat.isDeserializableString('01this is a plain text'),
        'should be false with an incorrect prefix',
      ).to.be.false;
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format is given', () => {
      expect(
        plainTextFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: 'this is a plain text',
        }),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        plainTextFormat.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'this is a plain text',
        }),
        'should be false with an incorrect type',
      ).to.be.false;
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      expect(
        plainTextFormat.serialize({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: 'this is a plain text',
        }),
        'serialize() error',
      ).to.be.equal('00this is a plain text');
    });

    it('cannot serialize a with incorrect type', () => {
      expect(() => {
        plainTextFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'this is a plain text',
        });
      }, 'serialize() error').to.throw('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '00this is a plain text';
      expect(
        plainTextFormat.deserialize(formatted),
        'deserialize(formatted) error',
      ).to.be.deep.equal({
        type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
        value: 'this is a plain text',
      });
    });

    it('should return false if an incorrect format is given to isDeserializableString', () => {
      expect(() => {
        plainTextFormat.deserialize('01this is a plain text');
      }, 'should throw with an incorrect prefix').to.throw('string is not a serialized string');
    });
  });
});
