import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../src/enum';
import Transaction from '../../src/transaction';

import * as TestData from './utils/test-data-generator';

const randomTx = {
  action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
  parameters: {
    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
    expectedAmount: '100000',
    payee: TestData.payeeRaw.identity,
    payer: TestData.payerRaw.identity,
  },
  version: '0.0.1',
};

/* tslint:disable:no-unused-expression */
describe('Transaction', () => {
  it('can getRequestId()', () => {
    const reqId = Transaction.getRequestId(randomTx);
    expect(reqId, 'getRequestId() error').to.be.equal(
      '0xea0d8cf694b3870bc1ca70e023b7bc63b4d9159f553677c00d7c6a5e4523da00',
    );
  });

  it('can getRoleInTransaction()', () => {
    expect(
      Transaction.getRoleInTransaction(TestData.payeeRaw.identity, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYEE);
    expect(
      Transaction.getRoleInTransaction(TestData.payerRaw.identity, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYER);
    expect(
      Transaction.getRoleInTransaction(TestData.otherIdRaw.identity, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.THIRD_PARTY);
  });

  it('can createSignedTransaction()', () => {
    const signedTx = Transaction.createSignedTransaction(randomTx, {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: TestData.payeeRaw.privateKey,
    });

    expect(signedTx.signature, 'createSignedTransaction() signature error').to.be.deep.equal({
      method: 'ecdsa',
      value:
        '0x69c9c40a81ed75ebd27b4515a6cde74c2e5b30ca159cacaca6557a82f6d5bae62976c1ca079b5810bb36046620e067ee1bc06c74ab7af5c99a0d87f3f53ac4c81c',
    });

    expect(signedTx.transaction, 'createSignedTransaction() transaction error').to.be.deep.equal(
      randomTx,
    );
  });

  it('can getSignerIdentityFromSignedTransaction()', () => {
    const id = Transaction.getSignerIdentityFromSignedTransaction({
      signature: {
        method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x69c9c40a81ed75ebd27b4515a6cde74c2e5b30ca159cacaca6557a82f6d5bae62976c1ca079b5810bb36046620e067ee1bc06c74ab7af5c99a0d87f3f53ac4c81c',
      },
      transaction: randomTx,
    });
    expect(id, 'recover() error').to.be.deep.equal(TestData.payeeRaw.identity);
  });
});
