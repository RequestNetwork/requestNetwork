/* eslint-disable spellcheck/spell-checker */
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

const arbitraryAES256gcmEncryptionParams: EncryptionTypes.IEncryptionParameters = {
  key: '+wqzz0nClfG9MNjEziGDfMPcxo7WwXQ/m/0ESEpmkCs=',
  method: EncryptionTypes.METHOD.AES256_GCM,
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
      // 'getIdentityFromEncryptionParams() error'
      expect(identity).toEqual(otherIdRaw.identity);
    });

    it('cannot getIdentityFromEncryptionParams with encryption method not supported', async () => {
      const params: any = {
        method: 'notECIES',
        publicKey: otherIdRaw.publicKey,
      };
      expect(() => Encryption.getIdentityFromEncryptionParams(params)).toThrowError(
        'encryptionParams.method not supported',
      );
    });
  });

  describe('encrypt', () => {
    it('can encrypt with ECIES', async () => {
      const encryptedData = await Encryption.encrypt(
        JSON.stringify(data),
        otherIdRaw.encryptionParams,
      );
      // 'encrypt() error'
      expect(encryptedData.value.length).toBe(258);
      // 'encrypt() error'
      expect(encryptedData.type).toBe(EncryptionTypes.METHOD.ECIES);
      // 'decrypt() error'
      expect(await Encryption.decrypt(encryptedData, otherIdRaw.decryptionParams)).toEqual(
        JSON.stringify(data),
      );
    });

    it('can encrypt with AES256-cbc', async () => {
      const encryptedData = await Encryption.encrypt(
        JSON.stringify(data),
        arbitraryAES256cbcEncryptionParams,
      );
      // 'encrypt() error'
      expect(encryptedData.value.length).toBe(88);
      // 'encrypt() error'
      expect(encryptedData.type).toBe(EncryptionTypes.METHOD.AES256_CBC);
      // 'decrypt() error'
      expect(await Encryption.decrypt(encryptedData, arbitraryAES256cbcEncryptionParams)).toEqual(
        JSON.stringify(data),
      );
    });

    it('can encrypt with AES256-gcm', async () => {
      const encryptedData = await Encryption.encrypt(
        JSON.stringify(data),
        arbitraryAES256gcmEncryptionParams,
      );
      // 'encrypt() error'
      expect(encryptedData.value.length).toBe(100);
      // 'encrypt() error'
      expect(encryptedData.type).toBe(EncryptionTypes.METHOD.AES256_GCM);
      // 'decrypt() error'
      expect(await Encryption.decrypt(encryptedData, arbitraryAES256gcmEncryptionParams)).toEqual(
        JSON.stringify(data),
      );
    });

    it('cannot encrypt with an encryption method not supported', async () => {
      const params: any = {
        method: 'notECIES',
        publicKey: otherIdRaw.publicKey,
      };

      await expect(Encryption.encrypt(JSON.stringify(data), params)).rejects.toThrowError(
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
      // 'decrypt() error'
      expect(dataDecrypted).toEqual(JSON.stringify(data));
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
      ).rejects.toThrowError('encryptedData method not supported');
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
      ).rejects.toThrowError('decryptionParams.method should be ecies');

      await expect(
        Encryption.decrypt(
          {
            type: EncryptionTypes.METHOD.AES256_CBC,
            value: 'c9a9',
          },
          otherIdRaw.decryptionParams,
        ),
      ).rejects.toThrowError('decryptionParams.method should be aes256-cbc');

      await expect(
        Encryption.decrypt(
          {
            type: EncryptionTypes.METHOD.AES256_GCM,
            value: 'c9a9',
          },
          arbitraryAES256cbcEncryptionParams,
        ),
      ).rejects.toThrowError('decryptionParams.method should be aes256-gcm');
    });
  });
});
