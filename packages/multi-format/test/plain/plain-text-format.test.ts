import { MultiFormatTypes } from '@requestnetwork/types';

import PlainTextFormat from '../../src/plain/plain-text-format';

let plainTextFormat: PlainTextFormat;

/* tslint:disable:no-unused-expression */
describe('plain/plain-text-format', () => {
  beforeEach(() => {
    plainTextFormat = new PlainTextFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format is given', () => {
      // 'isDeserializableString() error'
      expect(plainTextFormat.isDeserializableString('00this is a plain text')).toBe(true);
    });

    it('should return false if an incorrect format is given', () => {
      // 'should be false with an incorrect prefix'
      expect(plainTextFormat.isDeserializableString('01this is a plain text')).toBe(false);
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format is given', () => {
      // 'isDeserializableString() error'
      expect(
        plainTextFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: 'this is a plain text',
        }),
      ).toBe(true);
    });

    it('should return false if an incorrect format is given', () => {
      // 'should be false with an incorrect type'
      expect(
        plainTextFormat.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'this is a plain text',
        }),
      ).toBe(false);
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      // 'serialize() error'
      expect(
        plainTextFormat.serialize({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: 'this is a plain text',
        }),
      ).toBe('00this is a plain text');
    });

    it('cannot serialize a with incorrect type', () => {
      // 'serialize() error'
      expect(() => {
        plainTextFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'this is a plain text',
        });
      }).toThrowError('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '00this is a plain text';
      // 'deserialize(formatted) error'
      expect(plainTextFormat.deserialize(formatted)).toEqual({
        type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
        value: 'this is a plain text',
      });
    });

    it('should return false if an incorrect format is given to isDeserializableString', () => {
      // 'should throw with an incorrect prefix'
      expect(() => {
        plainTextFormat.deserialize('01this is a plain text');
      }).toThrowError('string is not a serialized string');
    });
  });
});
