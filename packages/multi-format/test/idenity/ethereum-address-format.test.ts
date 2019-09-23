import { expect } from 'chai';
import 'mocha';
import { IdentityTypes, MultiFormatTypes } from '@requestnetwork/types';

import EthereumAddressFormat from '../../src/identity/ethereum-address-format';

let ethereumAddressFormat: EthereumAddressFormat;

/* tslint:disable:no-unused-expression */
describe('hash/identity/ethereum-address-format', () => {
  beforeEach(() => {
    ethereumAddressFormat = new EthereumAddressFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a right formatted hash is given', () => {
      expect(
        ethereumAddressFormat.isDeserializableString('20Af083f77F1fFd54218d91491AFD06c9296EaC3ce'),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if a wrong formatted hash is given', () => {
      expect(
        ethereumAddressFormat.isDeserializableString('01Af083f77F1fFd54218d91491AFD06c9296EaC3ce'),
        'should be false with a wrong prefix',
      ).to.be.false;

      expect(
        ethereumAddressFormat.isDeserializableString('20Af083f77F1fFd54218d91491AFD06c9296EaC3c'),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        ethereumAddressFormat.isDeserializableString('20Af083f77F1fFd54218d91491AFD06c9296EaC3ce1'),
        'should be false with a longer size',
      ).to.be.false;
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a right formatted hash is given', () => {
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if a wrong formatted hash is given', () => {
      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '00Af083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'should be false with a wrong prefix',
      ).to.be.false;

      expect(
        ethereumAddressFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'should be false with a wrong type',
      ).to.be.false;

      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3c',
        }),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        ethereumAddressFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3cea',
        }),
        'should be false with a longer size',
      ).to.be.false;
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      expect(
        ethereumAddressFormat.serialize({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
        }),
        'serialize() error',
      ).to.be.equal('20af083f77f1ffd54218d91491afd06c9296eac3ce');
    });

    it('cannot serialize a hash with wrong length', () => {
      expect(() => {
        ethereumAddressFormat.serialize({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce000',
        });
      }, 'serialize() error').to.throw('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '20Af083f77F1fFd54218d91491AFD06c9296EaC3ce';
      expect(
        ethereumAddressFormat.deserialize(formatted),
        'deserialize(formatted) error',
      ).to.be.deep.equal({
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
      });
    });

    it('should return false if a wrong formatted hash is given to isDeserializableString', () => {
      expect(() => {
        ethereumAddressFormat.deserialize('01Af083f77F1fFd54218d91491AFD06c9296EaC3ce');
      }, 'should throw with a wrong prefix').to.throw('string is not a serialized string');
    });
  });
});
