import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';
import { expect } from 'chai';
import 'mocha';

import EciesFormat from '../../src/encryption/ecies-format';
let eciesFormat: EciesFormat;

/* tslint:disable:no-unused-expression */
describe('encryption/ecies-format', () => {
  beforeEach(() => {
    eciesFormat = new EciesFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format is given', () => {
      expect(
        eciesFormat.isDeserializableString(
          '02af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        eciesFormat.isDeserializableString(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
        'should be false with an incorrect prefix',
      ).to.be.false;
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format is given', () => {
      expect(
        eciesFormat.isSerializableObject({
          type: EncryptionTypes.METHOD.ECIES,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        eciesFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'should be false with an incorrect type',
      ).to.be.false;
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      expect(
        eciesFormat.serialize({
          type: EncryptionTypes.METHOD.ECIES,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'serialize() error',
      ).to.be.equal('02af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a with incorrect type', () => {
      expect(() => {
        eciesFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        });
      }, 'serialize() error').to.throw('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '02af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      expect(eciesFormat.deserialize(formatted), 'deserialize(formatted) error').to.be.deep.equal({
        type: EncryptionTypes.METHOD.ECIES,
        value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if an incorrect format is given to isDeserializableString', () => {
      expect(() => {
        eciesFormat.deserialize(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }, 'should throw with an incorrect prefix').to.throw('string is not a serialized string');
    });
  });
});
