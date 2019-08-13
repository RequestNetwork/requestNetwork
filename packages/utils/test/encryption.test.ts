import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import { EncryptionTypes, IdentityTypes, MultiFormatTypes } from '@requestnetwork/types';
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
    it('can encrypt()', async () => {
      const encryptedData = await Encryption.encrypt(
        JSON.stringify(data),
        otherIdRaw.encryptionParams,
      );
      expect(encryptedData.length, 'encrypt() error').to.be.equal(260);
      expect(encryptedData.slice(0, 2), 'encrypt() error').to.be.equal(
        MultiFormatTypes.prefix.ECIES_ENCRYPTED,
      );
      expect(
        await Encryption.decrypt(encryptedData, otherIdRaw.decryptionParams),
        'decrypt() error',
      ).to.be.deep.equal(data);
    });

    it('cannot encrypt with encryption method not supported', async () => {
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
    it('can decrypt()', async () => {
      const dataDecrypted = await Encryption.decrypt(
        '02c9a9ec155d54c68cd39fa0ac7d0b47a802c10565ca753bb3ad67688c12993a54d3b709d0edeea5f495cc334a8077aed998b4cd6edeb40a1f26f668f4d5840f4be81e2bf7d68c2fe93611db0963c51d5e6f52fdd185bb799a7b199012eab9a2d7eb258497cc525a285fe21d15e089f3024f4f86097d97d24591895af02450412501',
        otherIdRaw.decryptionParams,
      );
      expect(dataDecrypted, 'decrypt() error').to.be.deep.equal(data);
    });

    it('cannot decrypt with encryption method not supported', async () => {
      await expect(
        Encryption.decrypt('010000', otherIdRaw.decryptionParams),
      ).to.eventually.rejectedWith('encryptedData method not supported');
    });
  });
});
