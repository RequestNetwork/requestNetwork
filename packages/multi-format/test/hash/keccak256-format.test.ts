import { expect } from 'chai';
import 'mocha';
import { MultiFormatTypes } from '@requestnetwork/types';

import Keccak256Format from '../../src/hash/keccak256-format';

let keccak256Format: Keccak256Format;

/* tslint:disable:no-unused-expression */
describe('hash/keccak256-format', () => {
  beforeEach(() => {
    keccak256Format = new Keccak256Format();
  });

  describe('isDeserializableString', () => {
    it('should return true if a right formatted hash is given', () => {
      expect(
        keccak256Format.isDeserializableString(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if a wrong formatted hash is given', () => {
      expect(
        keccak256Format.isDeserializableString(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
        'should be false with a wrong prefix',
      ).to.be.false;

      expect(
        keccak256Format.isDeserializableString(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9',
        ),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        keccak256Format.isDeserializableString(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
        ),
        'should be false with a shorted size',
      ).to.be.false;
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a right formatted hash is given', () => {
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if a wrong formatted hash is given', () => {
      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'should be false with a wrong prefix',
      ).to.be.false;

      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'should be false with a wrong type',
      ).to.be.false;

      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d60885682f42a4308f907',
        }),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        keccak256Format.isSerializableObject({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        }),
        'should be false with a longer size',
      ).to.be.false;
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      expect(
        keccak256Format.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'serialize() error',
      ).to.be.equal('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a hash with wrong length', () => {
      expect(() => {
        keccak256Format.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        });
      }, 'serialize() error').to.throw('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      expect(
        keccak256Format.deserialize(formatted),
        'deserialize(formatted) error',
      ).to.be.deep.equal({
        type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
        value: '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if a wrong formatted hash is given to isDeserializableString', () => {
      expect(() => {
        keccak256Format.deserialize(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }, 'should throw with a wrong prefix').to.throw('string is not a serialized string');

      expect(() => {
        keccak256Format.deserialize(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9',
        );
      }, 'should throw with a shorter size').to.throw('string is not a serialized string');

      expect(() => {
        keccak256Format.deserialize(
          '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
        );
      }, 'should throw with a longer size').to.throw('string is not a serialized string');
    });
  });
});
