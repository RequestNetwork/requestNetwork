import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';
import { expect } from 'chai';
import 'mocha';

import Aes256CbcFormat from '../../src/encryption/aes256-cbc-format';
let aes256CbcFormat: Aes256CbcFormat;

/* tslint:disable:no-unused-expression */
describe('encryption/aes256-cbc-format', () => {
  beforeEach(() => {
    aes256CbcFormat = new Aes256CbcFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correctly formatted string is given', () => {
      expect(
        aes256CbcFormat.isDeserializableString(
          '03af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        aes256CbcFormat.isDeserializableString(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        ),
        'should be false with an incorrect prefix',
      ).to.be.false;
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format is given', () => {
      expect(
        aes256CbcFormat.isSerializableObject({
          type: EncryptionTypes.METHOD.AES256_CBC,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        aes256CbcFormat.isSerializableObject({
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
        aes256CbcFormat.serialize({
          type: EncryptionTypes.METHOD.AES256_CBC,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        }),
        'serialize() error',
      ).to.be.equal('03af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
    });

    it('cannot serialize a with incorrect type', () => {
      expect(() => {
        aes256CbcFormat.serialize({
          type: MultiFormatTypes.HashTypes.TYPE.KECCAK256,
          value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9071',
        });
      }, 'serialize() error').to.throw('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '03af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
      expect(
        aes256CbcFormat.deserialize(formatted),
        'deserialize(formatted) error',
      ).to.be.deep.equal({
        type: EncryptionTypes.METHOD.AES256_CBC,
        value: 'af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      });
    });

    it('should return false if an incorrect format is given to isDeserializableString', () => {
      expect(() => {
        aes256CbcFormat.deserialize(
          '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
        );
      }, 'should throw with an incorrect prefix').to.throw('string is not a serialized string');
    });
  });
});
