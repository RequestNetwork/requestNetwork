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
describe('actions/increaseExpectedAmount.format()', () => {
  it('can increase expected amount without extensions', () => {
    const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    expect(txIncreaseAmount, 'txIncreaseAmount.transaction must be a property').to.have.property(
      'transaction',
    );
    expect(txIncreaseAmount.transaction.action, 'action is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT,
    );
    expect(
      txIncreaseAmount.transaction,
      'txIncreaseAmount.transaction.parameters is wrong',
    ).to.have.property('parameters');

    expect(txIncreaseAmount.transaction.parameters.requestId, 'requestId is wrong').to.equal(
      requestIdMock,
    );
    expect(txIncreaseAmount.transaction.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
      arbitraryDeltaAmount,
    );
    expect(txIncreaseAmount.transaction.parameters.extensions, 'extensions is wrong').to.be
      .undefined;

    expect(txIncreaseAmount, 'txIncreaseAmount.signature must be a property').to.have.property(
      'signature',
    );
    expect(
      txIncreaseAmount.signature.method,
      'txIncreaseAmount.signature.method is wrong',
    ).to.equal(RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA);
    expect(txIncreaseAmount.signature.value, 'txIncreaseAmount.signature.value').to.equal(
      '0xa88a3d3a3671139f65d19ea92ecdbfaf910de54f2b27e25ba50e067cde6e4823085e5500f639b4f5172d55f95f2e7bb809478c8dddf3354eb4ac8d364d957c241b',
    );
  });

  it('can increase expected amount with extensions', () => {
    const extensions = [{ id: 'extension1', value: 'whatever' }];
    const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        extensions,
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    expect(txIncreaseAmount, 'txIncreaseAmount.transaction must be a property').to.have.property(
      'transaction',
    );
    expect(txIncreaseAmount.transaction.action, 'action is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT,
    );
    expect(
      txIncreaseAmount.transaction,
      'txIncreaseAmount.transaction.parameters is wrong',
    ).to.have.property('parameters');

    expect(txIncreaseAmount.transaction.parameters.requestId, 'requestId is wrong').to.equal(
      requestIdMock,
    );
    expect(txIncreaseAmount.transaction.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
      arbitraryDeltaAmount,
    );
    expect(txIncreaseAmount.transaction.parameters.extensions, 'extensions is wrong').to.deep.equal(
      extensions,
    );

    expect(txIncreaseAmount, 'txIncreaseAmount.signature must be a property').to.have.property(
      'signature',
    );
    expect(
      txIncreaseAmount.signature.method,
      'txIncreaseAmount.signature.method is wrong',
    ).to.equal(RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA);
    expect(txIncreaseAmount.signature.value, 'txIncreaseAmount.signature.value').to.equal(
      '0x6759b4ac8e0d4f1860b35b90ea2df0ba6476e1440da2fbaf5e5be7a0468cbe577f268a51f412f19058af4ec0df058502a9337324f316ee7218642615d1fe7efa1c',
    );
  });

  it('cannot increase expected amount with not a number', () => {
    try {
      const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
        {
          deltaAmount: 'this is not a number',
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

  it('cannot increase expected amount with decimal', () => {
    try {
      const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
        {
          deltaAmount: '0.12345',
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

  it('cannot increase expected amount with a negative number', () => {
    try {
      const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
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
