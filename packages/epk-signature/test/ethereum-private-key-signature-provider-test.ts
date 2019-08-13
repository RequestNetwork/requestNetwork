import 'mocha';

import { IdentityTypes, SignatureTypes } from '@requestnetwork/types';

import EthereumPrivateKeySignatureProvider from '../src/ethereum-private-key-signature-provider';

import Utils from '@requestnetwork/utils';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

const id1Raw = {
  address: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  },
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  },
};

export const id2Raw = {
  address: '0x818b6337657a23f58581715fc610577292e521d0',
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x818b6337657a23f58581715fc610577292e521d0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  },
};

const data = { What: 'ever', the: 'data', are: true };
const hashData = `0x${Utils.crypto.normalizeKeccak256Hash(data).slice(2)}`;
const signatureValueExpected = Utils.crypto.EcUtils.sign(id1Raw.privateKey, hashData);
const signedDataExpected = {
  data,
  signature: {
    method: SignatureTypes.METHOD.ECDSA,
    value: signatureValueExpected,
  },
};
/* tslint:disable:no-unused-expression */
describe('ethereum-private-key-signature-provider', () => {
  describe('constructor', () => {
    it('can construct', async () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      expect(
        signProvider.supportedIdentityTypes,
        'signProvider.supportedIdentityTypes is wrong',
      ).to.be.deep.equal([IdentityTypes.TYPE.ETHEREUM_ADDRESS]);
      expect(
        signProvider.supportedMethods,
        'signProvider.supportedMethods is wrong',
      ).to.be.deep.equal([SignatureTypes.METHOD.ECDSA]);

      expect(
        signProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([id1Raw.identity]);
    });
    it('cannot construct with a not supported signature parameter', async () => {
      expect(
        () =>
          new EthereumPrivateKeySignatureProvider({
            method: 'not_supported',
            privateKey: '0x0',
          } as any),
        'should have thrown',
      ).to.throw('Signing method not supported not_supported');
    });
    it('cannot construct with signature parameter value not valid', async () => {
      expect(
        () =>
          new EthereumPrivateKeySignatureProvider({
            method: SignatureTypes.METHOD.ECDSA,
            privateKey: '0x0',
          }),
        'should have thrown',
      ).to.throw('The private key must be a string representing 32 bytes');
    });
  });

  describe('addSignatureParameters', () => {
    it('can addSignatureParameters', () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      const identityAdded: IdentityTypes.IIdentity = signProvider.addSignatureParameters(
        id2Raw.signatureParams,
      );
      expect(identityAdded, 'identityAdded is wrong').to.deep.equal(id2Raw.identity);

      expect(
        signProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([id1Raw.identity, id2Raw.identity]);
    });

    it('cannot addSignatureParameters if method not supported', () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      const arbitraryParams: any = {
        method: 'unknown method',
        privateKey: '0x000',
      };
      expect(() => {
        signProvider.addSignatureParameters(arbitraryParams);
      }, 'should throw').to.throw('Signing method not supported unknown method');
    });
  });

  describe('removeSignatureParameters', () => {
    it('can removeSignatureParameters', () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);
      signProvider.addSignatureParameters(id2Raw.signatureParams);

      signProvider.removeRegisteredIdentity(id2Raw.identity);

      expect(
        signProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([id1Raw.identity]);
    });

    it('cannot removeSignatureParameters if method not supported', () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      const arbitraryIdentity: any = {
        type: 'unknown type',
        value: '0x000',
      };
      expect(() => {
        signProvider.removeRegisteredIdentity(arbitraryIdentity);
      }, 'should throw').to.throw('Identity type not supported unknown type');
    });
  });

  describe('clearAllSignatureParameters', () => {
    it('can clearAllSignatureParameters', () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);
      signProvider.addSignatureParameters(id2Raw.signatureParams);

      signProvider.clearAllRegisteredIdentities();

      expect(
        signProvider.getAllRegisteredIdentities(),
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal([]);
    });
  });

  describe('sign', () => {
    it('can sign', async () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      const signedData: SignatureTypes.ISignedData = await signProvider.sign(data, id1Raw.identity);

      expect(signedData, 'signedData is wrong').to.be.deep.equal(signedDataExpected);
    });
    it('cannot sign if identity not supported', async () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      const arbitraryIdentity: any = { type: 'unknown type', value: '0x000' };
      await expect(
        signProvider.sign(data, arbitraryIdentity),
        'should throw',
      ).to.eventually.be.rejectedWith('Identity type not supported unknown type');
    });
    it('cannot sign if private key of the identity not given', async () => {
      const signProvider = new EthereumPrivateKeySignatureProvider(id1Raw.signatureParams);

      const arbitraryIdentity: IdentityTypes.IIdentity = {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x000',
      };
      await expect(
        signProvider.sign(data, arbitraryIdentity),
        'should throw',
      ).to.eventually.be.rejectedWith('private key unknown for the address 0x000');
    });
  });
});
