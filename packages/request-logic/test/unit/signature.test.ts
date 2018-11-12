import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import Utils from '@requestnetwork/utils';
import * as RequestEnum from '../../src/enum';
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
  it('can getIdentityFromSignatureParams()', () => {
    const identity = Signature.getIdentityFromSignatureParams({
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: TestData.otherIdRaw.privateKey,
    });
    expect(identity, 'getIdentityFromSignatureParams() error').to.be.deep.equal(
      TestData.otherIdRaw.identity,
    );
  });

  it('can sign()', () => {
    const signature = Signature.sign(Utils.crypto.normalizeKeccak256Hash(data), {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: TestData.otherIdRaw.privateKey,
    });
    expect(signature, 'sign() error').to.be.deep.equal({
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      value:
        '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
    });
  });

  it('can sign() with different case', () => {
    const signature = Signature.sign(Utils.crypto.normalizeKeccak256Hash(dataDiffCase), {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: TestData.otherIdRaw.privateKey,
    });
    expect(signature, 'sign() error').to.be.deep.equal({
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      value:
        '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
    });
  });

  it('can recover()', () => {
    const id = Signature.recover(Utils.crypto.normalizeKeccak256Hash(data), {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      value:
        '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
    });
    expect(id, 'recover() error').to.be.deep.equal(TestData.otherIdRaw.identity);
  });

  it('can recover() with different case', () => {
    const id = Signature.recover(Utils.crypto.normalizeKeccak256Hash(dataDiffCase), {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      value:
        '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
    });
    expect(id, 'recover() error').to.be.deep.equal(TestData.otherIdRaw.identity);
  });
});
