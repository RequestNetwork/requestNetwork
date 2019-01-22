import 'mocha';

import { expect } from 'chai';

import { Signature as SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import TransactionCore from '../../src/transaction';

const signatureParams1: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
};

/* tslint:disable:no-unused-expression */
describe('index', () => {
  it('can create transaction', () => {
    const data = '{ what: "ever", it: "is,", this: "must", work: true }';

    const tx = TransactionCore.createTransaction(data, signatureParams1);

    const signatureExpected = Utils.signature.sign(
      Utils.crypto.normalizeKeccak256Hash(data),
      signatureParams1,
    );
    expect(tx, 'transaction not right').to.deep.equal({
      data,
      signature: signatureExpected,
    });
  });
});
