import 'mocha';

import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import EthereumPrivateKeyDecryptionProvider from '../src/ethereum-private-key-decryption-provider';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

export const id1Raw = {
  address: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  decryptionParams: {
    key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  },
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
};

export const id2Raw = {
  address: '0x818b6337657a23f58581715fc610577292e521d0',
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
    value: '0x818b6337657a23f58581715fc610577292e521d0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

const decryptedDataExpected = JSON.stringify({
  attribut1: 'VALUE',
  attribut2: 'Value',
});

/* tslint:disable:no-unused-expression */
describe('ethereum-private-key-decryption-provider', () => {
  describe('constructor', () => {
    it('can construct', async () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      expect(
        decryptionProvider.supportedIdentityTypes,
        'decryptionProvider.supportedIdentityTypes is wrong',
      ).to.be.deep.equal([IdentityTypes.TYPE.ETHEREUM_ADDRESS]);
      expect(
        decryptionProvider.supportedMethods,
        'decryptionProvider.supportedMethods is wrong',
      ).to.be.deep.equal([EncryptionTypes.METHOD.ECIES]);

      expect(
        decryptionProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([id1Raw.identity]);
    });
    it('cannot construct with decryption parameter not supported', async () => {
      expect(
        () =>
          new EthereumPrivateKeyDecryptionProvider({
            key: '0x0',
            method: 'not_supported',
          } as any),
        'should have thrown',
      ).to.throw('Encryption method not supported not_supported');
    });
    it('cannot construct with decryption parameter value not valid', async () => {
      expect(
        () =>
          new EthereumPrivateKeyDecryptionProvider({
            key: '0x0',
            method: EncryptionTypes.METHOD.ECIES,
          }),
        'should have thrown',
      ).to.throw('The private key must be a string representing 32 bytes');
    });
  });

  describe('addDecryptionParameters', () => {
    it('can addDecryptionParameters', () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      const identityAdded: IdentityTypes.IIdentity = decryptionProvider.addDecryptionParameters(
        id2Raw.decryptionParams,
      );
      expect(identityAdded, 'identityAdded is wrong').to.deep.equal(id2Raw.identity);

      expect(
        decryptionProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([id1Raw.identity, id2Raw.identity]);
    });

    it('cannot addDecryptionParameters if method not supported', () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      const arbitraryParams: any = {
        method: 'unknown method',
        privateKey: '0x000',
      };
      expect(() => {
        decryptionProvider.addDecryptionParameters(arbitraryParams);
      }, 'should throw').to.throw('Encryption method not supported unknown method');
    });
  });
  describe('removeDecryptionParameters', () => {
    it('can removeDecryptionParameters', () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);
      decryptionProvider.addDecryptionParameters(id2Raw.decryptionParams);

      decryptionProvider.removeRegisteredIdentity(id2Raw.identity);

      expect(
        decryptionProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([id1Raw.identity]);
    });

    it('cannot removeDecryptionParameters if method not supported', () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      const arbitraryIdentity: any = {
        type: 'unknown type',
        value: '0x000',
      };
      expect(() => {
        decryptionProvider.removeRegisteredIdentity(arbitraryIdentity);
      }, 'should throw').to.throw('Identity type not supported unknown type');
    });
  });

  describe('clearAllDecryptionParameters', () => {
    it('can clearAllDecryptionParameters', () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);
      decryptionProvider.addDecryptionParameters(id2Raw.decryptionParams);

      decryptionProvider.clearAllRegisteredIdentities();

      expect(
        decryptionProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([]);
    });
  });

  describe('decrypt', () => {
    it('can decrypt', async () => {
      const encryptedData = await Utils.encryption.encrypt(
        decryptedDataExpected,
        id1Raw.encryptionParams,
      );

      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      const decryptedData: string = await decryptionProvider.decrypt(
        encryptedData,
        id1Raw.identity,
      );

      expect(decryptedData, 'decryptedData is wrong').to.be.deep.equal(decryptedDataExpected);
    });

    it('cannot decrypt if encryption not supported', async () => {
      const encryptedData = { type: EncryptionTypes.METHOD.AES256_CBC, value: '0000000' };
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      await expect(
        decryptionProvider.decrypt(encryptedData, id1Raw.identity),
        'should throw',
      ).to.eventually.be.rejectedWith(
        `The data must be encrypted with ${EncryptionTypes.METHOD.ECIES}`,
      );
    });

    it('cannot decrypt if identity not supported', async () => {
      const encryptedData = await Utils.encryption.encrypt(
        decryptedDataExpected,
        id1Raw.encryptionParams,
      );
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      const arbitraryIdentity: any = { type: 'unknown type', value: '0x000' };
      await expect(
        decryptionProvider.decrypt(encryptedData, arbitraryIdentity),
        'should throw',
      ).to.eventually.be.rejectedWith('Identity type not supported unknown type');
    });

    it('cannot decrypt if private key of the identity not given', async () => {
      const encryptedData = await Utils.encryption.encrypt(
        decryptedDataExpected,
        id1Raw.encryptionParams,
      );
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      const arbitraryIdentity: IdentityTypes.IIdentity = {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x000',
      };
      await expect(
        decryptionProvider.decrypt(encryptedData, arbitraryIdentity),
        'should throw',
      ).to.eventually.be.rejectedWith('private key unknown for the identity: 0x000');
    });
  });
  describe('isIdentityRegistered', () => {
    it('can check if an identity is registered', async () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);

      expect(
        await decryptionProvider.isIdentityRegistered(id1Raw.identity),
        'id1Raw must be registered',
      ).to.be.true;
    });

    it('can check if an identity is NOT registered', async () => {
      const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(id1Raw.decryptionParams);
      expect(
        await decryptionProvider.isIdentityRegistered(id2Raw.identity),
        'id2Raw must not be registered',
      ).to.be.false;
    });
  });
});
