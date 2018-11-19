import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Signature from '../../src/signature';

import * as TestData from './utils/test-data-generator';

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
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.otherIdRaw.privateKey,
      });
      expect(identity, 'getIdentityFromSignatureParams() error').to.be.deep.equal(
        TestData.otherIdRaw.identity,
      );
    });

    it('cannot getIdentityFromSignatureParams with signature method not supported', () => {
      try {
        const params: any = {
          method: 'notECDSA',
          privateKey: TestData.otherIdRaw.privateKey,
        };
        Signature.getIdentityFromSignatureParams(params);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal('signatureParams.method not supported');
      }
    });
  });

  describe('sign', () => {
    it('can sign()', () => {
      const signature = Signature.sign(Utils.crypto.normalizeKeccak256Hash(data), {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.otherIdRaw.privateKey,
      });
      expect(signature, 'sign() error').to.be.deep.equal({
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
      });
    });

    it('can sign() with different case', () => {
      const signature = Signature.sign(Utils.crypto.normalizeKeccak256Hash(dataDiffCase), {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.otherIdRaw.privateKey,
      });
      expect(signature, 'sign() error').to.be.deep.equal({
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
      });
    });

    it('cannot sign with signature method not supported', () => {
      try {
        const params: any = {
          method: 'notECDSA',
          privateKey: TestData.otherIdRaw.privateKey,
        };
        Signature.sign(Utils.crypto.normalizeKeccak256Hash(data), params);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal('signatureParams.method not supported');
      }
    });
  });

  describe('recover', () => {
    it('can recover()', () => {
      const id = Signature.recover(Utils.crypto.normalizeKeccak256Hash(data), {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
      });
      expect(id, 'recover() error').to.be.deep.equal(TestData.otherIdRaw.identity);
    });

    it('can recover() with different case', () => {
      const id = Signature.recover(Utils.crypto.normalizeKeccak256Hash(dataDiffCase), {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
      });
      expect(id, 'recover() error').to.be.deep.equal(TestData.otherIdRaw.identity);
    });

    it('cannot recover with signature method not supported', () => {
      try {
        const params: any = {
          method: 'notECDSA',
          value: '0x00000000000000000000',
        };
        Signature.recover(Utils.crypto.normalizeKeccak256Hash(data), params);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.equal('signatureParams.method not supported');
      }
    });
  });
});
