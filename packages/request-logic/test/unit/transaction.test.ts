import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../src/enum';
import Transaction from '../../src/transaction';

const payeeRaw = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

const payee = {
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0x818B6337657A23F58581715Fc610577292e521D0',
};

const payer = {
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0x8f7E6D3AA090D5Ed7eF4882B4E59F724377f6bFF',
};

const otherId = {
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0x212D95FcCdF0366343350f486bda1ceAfC0C2d63',
};

const randomTx = {
  action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
  parameters: {
    currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
    expectedAmount: '100000',
    payee,
    payer,
  },
  version: '0.0.1',
};

/* tslint:disable:no-unused-expression */
describe('Transaction', () => {
  it('can getRequestId()', () => {
    const reqId = Transaction.getRequestId(randomTx);
    expect(reqId, 'getRequestId() error').to.be.equal(
      '0xc0d5823c435e40be4ebceba4b2142dcf13d90489d5502e04e4b6bbbde206baca',
    );
  });

  it('can getRoleInTransaction()', () => {
    expect(
      Transaction.getRoleInTransaction(payee, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYEE);
    expect(
      Transaction.getRoleInTransaction(payer, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYER);
    expect(
      Transaction.getRoleInTransaction(otherId, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.THIRD_PARTY);
  });

  it('can createSignedTransaction()', () => {
    const signedTx = Transaction.createSignedTransaction(randomTx, {
      method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: payeeRaw.privateKey,
    });

    expect(signedTx.signature, 'createSignedTransaction() signature error').to.be.deep.equal({
      method: 'ecdsa',
      value:
        '0x714d09b150416d53df938afdd5a8f30e20129da800574f51582ae7a773363d103b12e5cd8adade056a14da67c5cc74f74f38ef1ab7f7b7d2534b589574a41fe21b',
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
          '0x714d09b150416d53df938afdd5a8f30e20129da800574f51582ae7a773363d103b12e5cd8adade056a14da67c5cc74f74f38ef1ab7f7b7d2534b589574a41fe21b',
      },
      transaction: randomTx,
    });
    expect(id, 'recover() error').to.be.deep.equal(payee);
  });
});
