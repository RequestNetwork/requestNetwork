import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Encryption from '../src/encryption';

const otherIdRaw = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  decryptionParams: {
    key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x818B6337657A23F58581715Fc610577292e521D0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

const arbitraryAES256cbcEncryptionParams: EncryptionTypes.IEncryptionParameters = {
  key: '+wqzz0nClfG9MNjEziGDfMPcxo7WwXQ/m/0ESEpmkCs=',
  method: EncryptionTypes.METHOD.AES256_CBC,
};

const data = {
  attribut1: 'VALUE',
  attribut2: 'Value',
};

/* tslint:disable:no-unused-expression */
describe('Encryption', () => {
  describe('getIdentityFromEncryptionParams', () => {
    it('can getIdentityFromEncryptionParams()', () => {
      const identity = Encryption.getIdentityFromEncryptionParams(otherIdRaw.encryptionParams);
      expect(identity, 'getIdentityFromEncryptionParams() error').to.be.deep.equal(
        otherIdRaw.identity,
      );
    });

    it('cannot getIdentityFromEncryptionParams with encryption method not supported', () => {
      try {
        const params: any = {
          method: 'notECIES',
          publicKey: otherIdRaw.publicKey,
        };
        Encryption.getIdentityFromEncryptionParams(params);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal('encryptionParams.method not supported');
      }
    });
  });

  describe('encrypt', () => {
    it('can encrypt with ECIES', async () => {
      const encryptedData = await Encryption.encrypt(
        JSON.stringify(data),
        otherIdRaw.encryptionParams,
      );
      expect(encryptedData.value.length, 'encrypt() error').to.be.equal(258);
      expect(encryptedData.type, 'encrypt() error').to.be.equal(EncryptionTypes.METHOD.ECIES);
      expect(
        await Encryption.decrypt(encryptedData, otherIdRaw.decryptionParams),
        'decrypt() error',
      ).to.be.deep.equal(JSON.stringify(data));
    });

    it('can encrypt with AES256-cbc', async () => {
      const encryptedData = await Encryption.encrypt(
        JSON.stringify(data),
        arbitraryAES256cbcEncryptionParams,
      );
      expect(encryptedData.value.length, 'encrypt() error').to.be.equal(88);
      expect(encryptedData.type, 'encrypt() error').to.be.equal(EncryptionTypes.METHOD.AES256_CBC);
      expect(
        await Encryption.decrypt(encryptedData, arbitraryAES256cbcEncryptionParams),
        'decrypt() error',
      ).to.be.deep.equal(JSON.stringify(data));
    });

    it('cannot encrypt with an encryption method not supported', async () => {
      const params: any = {
        method: 'notECIES',
        publicKey: otherIdRaw.publicKey,
      };

      await expect(Encryption.encrypt(JSON.stringify(data), params)).to.eventually.rejectedWith(
        'encryptionParams.method not supported',
      );
    });
  });

  describe('decrypt', () => {
    it('can decrypt encrypted data', async () => {
      const dataDecrypted = await Encryption.decrypt(
        {
          type: EncryptionTypes.METHOD.ECIES,
          value:
            'c9a9ec155d54c68cd39fa0ac7d0b47a802c10565ca753bb3ad67688c12993a54d3b709d0edeea5f495cc334a8077aed998b4cd6edeb40a1f26f668f4d5840f4be81e2bf7d68c2fe93611db0963c51d5e6f52fdd185bb799a7b199012eab9a2d7eb258497cc525a285fe21d15e089f3024f4f86097d97d24591895af02450412501',
        },
        otherIdRaw.decryptionParams,
      );
      expect(dataDecrypted, 'decrypt() error').to.be.deep.equal(JSON.stringify(data));
    });

    it('cannot decrypt with an encryption method not supported', async () => {
      await expect(
        Encryption.decrypt(
          {
            type: 'not supported' as any,
            value:
              'c9a9ec155d54c68cd39fa0ac7d0b47a802c10565ca753bb3ad67688c12993a54d3b709d0edeea5f495cc334a8077aed998b4cd6edeb40a1f26f668f4d5840f4be81e2bf7d68c2fe93611db0963c51d5e6f52fdd185bb799a7b199012eab9a2d7eb258497cc525a285fe21d15e089f3024f4f86097d97d24591895af02450412501',
          },
          otherIdRaw.decryptionParams,
        ),
      ).to.eventually.rejectedWith('encryptedData method not supported');
    });

    it('cannot decrypt with the wrong decryption method', async () => {
      await expect(
        Encryption.decrypt(
          {
            type: EncryptionTypes.METHOD.ECIES,
            value: 'c9a9',
          },
          arbitraryAES256cbcEncryptionParams,
        ),
      ).to.eventually.rejectedWith('decryptionParams.method should be ecies');

      await expect(
        Encryption.decrypt(
          {
            type: EncryptionTypes.METHOD.AES256_CBC,
            value: 'c9a9',
          },
          otherIdRaw.decryptionParams,
        ),
      ).to.eventually.rejectedWith('decryptionParams.method should be aes256-cbc');
    });
  });
});
