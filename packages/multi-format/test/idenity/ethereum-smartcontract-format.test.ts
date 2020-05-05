import { expect } from 'chai';
import 'mocha';

import { IdentityTypes, MultiFormatTypes } from '@requestnetwork/types';

import EthereumSmartcontractFormat from '../../src/identity/ethereum-smartcontract-format';

let ethereumSmartcontractFormat: EthereumSmartcontractFormat;

/* tslint:disable:no-unused-expression */
describe('hash/identity/ethereum-address-format', () => {
  beforeEach(() => {
    ethereumSmartcontractFormat = new EthereumSmartcontractFormat();
  });

  describe('isDeserializableString', () => {
    it('should return true if a correct format is given', () => {
      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce',
        ),
        'isDeserializableString() error',
      ).to.be.true;

      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce-rinkeby',
        ),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '20Af083f77F1fFd54218d91491AFD06c9296EaC3ce',
        ),
        'should be false with an incorrect prefix',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3c',
        ),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce1-rinkeby',
        ),
        'should be false with a longer size',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3c-rinkeby',
        ),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce1',
        ),
        'should be false with a longer size',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isDeserializableString(
          '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce-',
        ),
        'network expected',
      ).to.be.false;
    });
  });

  describe('isSerializableObject', () => {
    it('should return true if a correct format is given', () => {
      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'isDeserializableString() error',
      ).to.be.true;

      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          extra: { network: 'rinkeby' },
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'isDeserializableString() error',
      ).to.be.true;
    });

    it('should return false if an incorrect format is given', () => {
      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '00Af083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'should be false with an incorrect prefix',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          type: MultiFormatTypes.PlainTypes.TYPE.PLAIN_TEXT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'should be false with an incorrect type',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3c',
        }),
        'should be false with a shorter size',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3cea',
        }),
        'should be false with a longer size',
      ).to.be.false;

      expect(
        ethereumSmartcontractFormat.isSerializableObject({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '00Af083f77F1fFd54218d91491AFD06c9296EaC3ce',
        }),
        'should be false with an incorrect type',
      ).to.be.false;
    });
  });

  describe('serialize', () => {
    it('can serialize', () => {
      expect(
        ethereumSmartcontractFormat.serialize({
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
        }),
        'serialize() error',
      ).to.be.equal('21af083f77f1ffd54218d91491afd06c9296eac3ce');
    });
    it('can serialize with network', () => {
      expect(
        ethereumSmartcontractFormat.serialize({
          extra: { network: 'mainnet' },
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
        }),
        'serialize() error',
      ).to.be.equal('21af083f77f1ffd54218d91491afd06c9296eac3ce-mainnet');
    });

    it('cannot serialize a hash with incorrect length', () => {
      expect(() => {
        ethereumSmartcontractFormat.serialize({
          type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
          value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce000',
        });
      }, 'serialize() error').to.throw('object is not a serializable object');
    });
  });

  describe('deserialize', () => {
    it('can deserialize', () => {
      const formatted = '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce';
      expect(
        ethereumSmartcontractFormat.deserialize(formatted),
        'deserialize(formatted) error',
      ).to.be.deep.equal({
        type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
        value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
      });
    });
    it('can deserialize with network', () => {
      const formatted = '21Af083f77F1fFd54218d91491AFD06c9296EaC3ce-rinkeby';
      expect(
        ethereumSmartcontractFormat.deserialize(formatted),
        'deserialize(formatted) error',
      ).to.be.deep.equal({
        extra: { network: 'rinkeby' },
        type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
        value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
      });
    });

    it('should return false if an incorrect format is given to isDeserializableString', () => {
      expect(() => {
        ethereumSmartcontractFormat.deserialize('01Af083f77F1fFd54218d91491AFD06c9296EaC3ce');
      }, 'should throw with an incorrect prefix').to.throw('string is not a serialized string');
    });
  });
});
