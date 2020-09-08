import { MultiFormatTypes } from '@requestnetwork/types';

import Keccak256Format from '../../src/hash/keccak256-format';

let keccak256Format: Keccak256Format;

/* tslint:disable:no-unused-expression */
describe('hash/keccak256-format', () => {
  beforeEach(() => {
    keccak256Format = new Keccak256Format();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format hash is given', () => {
      // 'isDeserializableString() error'
      expect(
        keccak256Format.isDeserializableString(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
      ).toBe(true);
    });

    it('should return false if an incorrect format hash is given', () => {
      // 'should be false with an incorrect prefix'
      expect(
        keccak256Format.isDeserializableString(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
      ).toBe(false);

      // 'should be false with a shorter size'
      expect(
        keccak256Format.isDeserializableString(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9',
        ),
      ).toBe(false);

      // 'should be false with a shorted size'
      expect(
        keccak256Format.isDeserializableString(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
        ),
      ).toBe(false);
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format hash is given', () => {
      // 'isDeserializableString() error'
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe(true);
    });

    it('should return false if an incorrect format hash is given', () => {
      // 'should be false with an incorrect prefix'
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe(false);

      // 'should be false with an incorrect type'
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe(false);

      // 'should be false with a shorter size'
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d60885682f42a4308f907',
        }),
      ).toBe(false);

      // 'should be false with a longer size'
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        }),
      ).toBe(false);
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      // 'serialize() error'
      expect(
        keccak256Format.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
      ).toBe('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a hash with incorrect length', () => {
      // 'serialize() error'
      expect(() => {
        keccak256Format.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        });
      }).toThrowError('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      // 'deserialize(formatted) error'
      expect(keccak256Format.deserialize(formatted)).toEqual({
        type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
        value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if an incorrect format hash is given to isDeserializableString', () => {
      // 'should throw with an incorrect prefix'
      expect(() => {
        keccak256Format.deserialize(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }).toThrowError('string is not a serialized string');

      // 'should throw with a shorter size'
      expect(() => {
        keccak256Format.deserialize(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9',
        );
      }).toThrowError('string is not a serialized string');

      // 'should throw with a longer size'
      expect(() => {
        keccak256Format.deserialize(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
        );
      }).toThrowError('string is not a serialized string');
    });
  });
});
