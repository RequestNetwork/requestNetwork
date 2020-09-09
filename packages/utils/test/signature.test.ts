import { IdentityTypes, SignatureTypes } from '@requestnetwork/types';
import Crypto from '../src/crypto';
import Signature from '../src/signature';

const otherIdRaw = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x818B6337657A23F58581715Fc610577292e521D0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  },
};

const data = {
  attribut1: 'VALUE',
  attribut2: 'Value',
};

const dataDiffCase = {
  attribut1: 'value',
  attribut2: 'value',
};

/* tslint:disable:no-unused-expression */
describe('Signature', () => {
  describe('getIdentityFromSignatureParams', () => {
    it('can getIdentityFromSignatureParams()', () => {
      const identity = Signature.getIdentityFromSignatureParams({
        method: SignatureTypes.METHOD.ECDSA,
        privateKey: otherIdRaw.privateKey,
      });
      // 'getIdentityFromSignatureParams() error'
      expect(identity).toEqual(otherIdRaw.identity);
    });

    it(
      'cannot getIdentityFromSignatureParams with signature method not supported',
      () => {
        const params: any = {
          method: 'notECDSA',
          privateKey: otherIdRaw.privateKey,
        };
        expect(() => Signature.getIdentityFromSignatureParams(params)).toThrowError('signatureParams.method not supported');
      }
    );
  });

  describe('sign', () => {
    it('can sign() with ECDSA', () => {
      const signature = Signature.sign(data, {
        method: SignatureTypes.METHOD.ECDSA,
        privateKey: otherIdRaw.privateKey,
      });
      // 'sign() error'
      expect(signature).toEqual({
        data,
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
        },
      });
    });

    it('can sign() with ECDSA_ETHEREUM', () => {
      const signature = Signature.sign(data, {
        method: SignatureTypes.METHOD.ECDSA_ETHEREUM,
        privateKey: otherIdRaw.privateKey,
      });
      // 'sign() error'
      expect(signature).toEqual({
        data,
        signature: {
          method: SignatureTypes.METHOD.ECDSA_ETHEREUM,
          value:
            '0x3fbc7ed9dfa003067f646749d4223def2a69df70371d4f15ec001bc1491cdee40558de1f31fdc7cc5d805a5c4080b54cda3430b29ab14f04e17a5b23fcd39b391b',
        },
      });
    });

    it('can sign() with different case', () => {
      const signature = Signature.sign(dataDiffCase, {
        method: SignatureTypes.METHOD.ECDSA,
        privateKey: otherIdRaw.privateKey,
      });
      // 'sign() error'
      expect(signature).toEqual({
        data: dataDiffCase,
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
        },
      });
    });

    it('cannot sign with signature method not supported', () => {
      const params: any = {
        method: 'notECDSA',
        privateKey: otherIdRaw.privateKey,
      };
      expect(() => Signature.sign(Crypto.normalizeKeccak256Hash(data), params)).toThrowError('signatureParams.method not supported');
    });
  });

  describe('recover', () => {
    it('can recover() ECDSA signature', () => {
      const id = Signature.recover({
        data,
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
        },
      });
      // 'recover() error'
      expect(id).toEqual(otherIdRaw.identity);
    });

    it('can recover() ECDSA_ETHEREUM signature', () => {
      const id = Signature.recover({
        data,
        signature: {
          method: SignatureTypes.METHOD.ECDSA_ETHEREUM,
          value:
            '0x3fbc7ed9dfa003067f646749d4223def2a69df70371d4f15ec001bc1491cdee40558de1f31fdc7cc5d805a5c4080b54cda3430b29ab14f04e17a5b23fcd39b391b',
        },
      });
      // 'recover() error'
      expect(id.value).toEqual(otherIdRaw.identity.value.toLowerCase());
      // 'recover() error'
      expect(id.type).toEqual(otherIdRaw.identity.type);
    });

    it('can recover() with different case', () => {
      const id = Signature.recover({
        data: dataDiffCase,
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
        },
      });
      // 'recover() error'
      expect(id).toEqual(otherIdRaw.identity);
    });

    it('cannot recover with signature method not supported', () => {
      const params: any = {
        method: 'notECDSA',
        value: '0x00000000000000000000',
      };
      expect(() => Signature.recover({ data, signature: params })).toThrowError('signatureParams.method not supported');
    });
  });
});
