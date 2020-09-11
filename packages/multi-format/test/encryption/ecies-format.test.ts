import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import EciesFormat from '../../src/encryption/ecies-format';
let eciesFormat: EciesFormat;

/* tslint:disable:no-unused-expression */
describe('encryption/ecies-format', () => {
  beforeEach(() => {
    eciesFormat = new EciesFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format is given', () => {
      // 'isDeserializableString() error'
      expect(
        eciesFormat.isDeserializableString(
          '02af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
      ).toBe(true);
    });

    it('should return false if an incorrect format is given', () => {
      // 'should be false with an incorrect prefix'
      expect(
        eciesFormat.isDeserializableString(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
      ).toBe(false);
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format is given', () => {
      // 'isDeserializableString() error'
      expect(
        eciesFormat.isSerializableObject({
          type: EncryptionTypes.METHOD.ECIES,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe(true);
    });

    it('should return false if an incorrect format is given', () => {
      // 'should be false with an incorrect type'
      expect(
        eciesFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe(false);
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      // 'serialize() error'
      expect(
        eciesFormat.serialize({
          type: EncryptionTypes.METHOD.ECIES,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe('02af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a with incorrect type', () => {
      // 'serialize() error'
      expect(() => {
        eciesFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        });
      }).toThrowError('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '02af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      // 'deserialize(formatted) error'
      expect(eciesFormat.deserialize(formatted)).toEqual({
        type: EncryptionTypes.METHOD.ECIES,
        value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if an incorrect format is given to isDeserializableString', () => {
      // 'should throw with an incorrect prefix'
      expect(() => {
        eciesFormat.deserialize(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }).toThrowError('string is not a serialized string');
    });
  });
});
