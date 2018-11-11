import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../../src/enum';
import RequestLogic from '../../../src/requestLogic';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

// payee id
const payeeRaw = {
  address: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
};

// payer id
const payerRaw = {
  address: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  publicKey:
    '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
};

// another id
const otherIdRaw = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

const arbitraryDeltaAmount = '100000000000000000';
const requestIdMock = '0x123456789123456789123456798132456789';

/* tslint:disable:no-unused-expression */
describe('actions/reduceExpectedAmount.format()', () => {
  it('can reduce expected amount without extensions', () => {
    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    expect(txReduceAmount, 'txReduceAmount.transaction should be a property').to.have.property(
      'transaction',
    );
    expect(txReduceAmount.transaction.action, 'action is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
    );
    expect(
      txReduceAmount.transaction,
      'txReduceAmount.transaction.parameters is wrong',
    ).to.have.property('parameters');

    expect(txReduceAmount.transaction.parameters.requestId, 'requestId is wrong').to.equal(
      requestIdMock,
    );
    expect(txReduceAmount.transaction.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
      arbitraryDeltaAmount,
    );
    expect(txReduceAmount.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;

    expect(txReduceAmount, 'txReduceAmount.signature should be a property').to.have.property(
      'signature',
    );
    expect(txReduceAmount.signature.method, 'txReduceAmount.signature.method is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
    );
    expect(txReduceAmount.signature.value, 'txReduceAmount.signature.value').to.equal(
      '0x3e8029339b7365d3f25c5070b13c0d9f72b606e9368a3a7900debd2275f636135248df830767e9595059aaa0dd0b0ba4390dcab5a070831c3493bd77082a39501b',
    );
  });

  it('can reduce expected amount with extensions', () => {
    const extensions = [{ id: 'extension1', value: 'whatever' }];

    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        extensions,
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    expect(txReduceAmount, 'txReduceAmount.transaction should be a property').to.have.property(
      'transaction',
    );
    expect(txReduceAmount.transaction.action, 'action is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
    );
    expect(
      txReduceAmount.transaction,
      'txReduceAmount.transaction.parameters is wrong',
    ).to.have.property('parameters');

    expect(txReduceAmount.transaction.parameters.requestId, 'requestId is wrong').to.equal(
      requestIdMock,
    );
    expect(txReduceAmount.transaction.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
      arbitraryDeltaAmount,
    );
    expect(txReduceAmount.transaction.parameters.extensions, 'extensions is wrong').to.deep.equal(
      extensions,
    );

    expect(txReduceAmount, 'txReduceAmount.signature should be a property').to.have.property(
      'signature',
    );
    expect(txReduceAmount.signature.method, 'txReduceAmount.signature.method is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
    );
    expect(txReduceAmount.signature.value, 'txReduceAmount.signature.value').to.equal(
      '0xc04b3e93126b3900fd449c2d5873985e43de17fb9d2b656a30cd62a9ab1adf1d0d3d24c78d6e1922a2f281ab1d593233c2eded97b3ab59b531c8c244650c877f1c',
    );
  });

  it('cannot reduce expected amount with not a number', () => {
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: 'this not a number',
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payerRaw.privateKey,
        },
      );
      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'deltaAmount must be a string representing a positive integer',
      );
    }
  });

  it('cannot reduce expected amount with decimal', () => {
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: '0.1234',
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payerRaw.privateKey,
        },
      );
      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'deltaAmount must be a string representing a positive integer',
      );
    }
  });

  it('cannot reduce expected amount with negative', () => {
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: '-1234',
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payerRaw.privateKey,
        },
      );
      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'deltaAmount must be a string representing a positive integer',
      );
    }
  });
});
