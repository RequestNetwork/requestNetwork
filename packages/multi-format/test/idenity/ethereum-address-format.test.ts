import { IdentityTypes, MultiFormatTypes } from '@requestnetwork/types';

import EthereumAddressFormat from '../../src/identity/ethereum-address-format';

let ethereumAddressFormat: EthereumAddressFormat;

/* tslint:disable:no-unused-expression */
describe('hash/identity/ethereum-address-format', () => {
  beforeEach(() => {
    ethereumAddressFormat = new EthereumAddressFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format hash is given', () => {
      // 'isDeserializableString() error'
      expect(
        ethereumAddressFormat.isDeserializableString('20Af083f77F1fFd54218d91491AFD06c9296EaC3ce'),
      ).toBe(true);
    });

    it('should return false if an incorrect format hash is given', () => {
      // 'should be false with an incorrect prefix'
      expect(
        ethereumAddressFormat.isDeserializableString('01Af083f77F1fFd54218d91491AFD06c9296EaC3ce'),
      ).toBe(false);

      // 'should be false with a shorter size'
      expect(
        ethereumAddressFormat.isDeserializableString('20Af083f77F1fFd54218d91491AFD06c9296EaC3c'),
      ).toBe(false);

      // 'should be false with a longer size'
      expect(
        ethereumAddressFormat.isDeserializableString('20Af083f77F1fFd54218d91491AFD06c9296EaC3ce1'),
      ).toBe(false);
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format hash is given', () => {
      // 'isDeserializableString() error'
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
      ).toBe(true);
    });

    it('should return false if an incorrect format hash is given', () => {
      // 'should be false with an incorrect prefix'
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '00Af083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
      ).toBe(false);

      // 'should be false with an incorrect type'
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
      ).toBe(false);

      // 'should be false with a shorter size'
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3c',
        }),
      ).toBe(false);

      // 'should be false with a longer size'
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3cea',
        }),
      ).toBe(false);
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      // 'serialize() error'
      expect(
        ethereumAddressFormat.serialize({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
        }),
      ).toBe('20af083f77f1ffd54218d91491afd06c9296eac3ce');
    });

    it('cannot serialize a hash with incorrect length', () => {
      // 'serialize() error'
      expect(() => {
        ethereumAddressFormat.serialize({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce000',
        });
      }).toThrowError('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '20Af083f77F1fFd54218d91491AFD06c9296EaC3ce';
      // 'deserialize(formatted) error'
      expect(ethereumAddressFormat.deserialize(formatted)).toEqual({
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
      });
    });

    it('should return false if an incorrect format hash is given to isDeserializableString', () => {
      // 'should throw with an incorrect prefix'
      expect(() => {
        ethereumAddressFormat.deserialize('01Af083f77F1fFd54218d91491AFD06c9296EaC3ce');
      }).toThrowError('string is not a serialized string');
    });
  });
});
