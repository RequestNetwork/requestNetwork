import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import Utils from '@requestnetwork/utils';
import * as RequestEnum from '../../src/enum';
import Signature from '../../src/signature';

const rawId = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  identity: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
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

const dataDiffCase = {
  attribut1: 'value',
  attribut2: 'value',
};

/* tslint:disable:no-unused-expression */
describe('Signature', () => {
  it('can getIdentityFromSignatureParams()', () => {
    const identity = Signature.getIdentityFromSignatureParams({
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: rawId.privateKey,
    });
    expect(identity, 'getIdentityFromSignatureParams() error').to.be.deep.equal(rawId.identity);
  });

  it('can sign()', () => {
    const signature = Signature.sign(Utils.crypto.normalizeKeccak256Hash(data), {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: rawId.privateKey,
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
      privateKey: rawId.privateKey,
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
    expect(id, 'recover() error').to.be.deep.equal(rawId.identity);
  });

  it('can recover() with different case', () => {
    const id = Signature.recover(Utils.crypto.normalizeKeccak256Hash(dataDiffCase), {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      value:
        '0x801f4240516509c28660f096830d52e8523e2136d557d65728e39f3ea37b72bb3f20accff461cabe3515431d0e6c468d4631540b7c6f9c29acfa7c9231781a3c1c',
    });
    expect(id, 'recover() error').to.be.deep.equal(rawId.identity);
  });
});
