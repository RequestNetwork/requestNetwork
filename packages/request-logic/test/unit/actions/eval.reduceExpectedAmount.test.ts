import { expect } from 'chai';
import 'mocha';

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

const requestIdMock = '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8';

const arbitraryExpectedAmount = '123400000000000000';
const biggerThanArbitraryExpectedAmount = '223400000000000000';
const arbitraryDeltaAmount = '100000000000000000';
const arbitraryDeltaAmountNegative = '-100000000000000000';
const arbitraryExpectedAmountAfterDelta = '23400000000000000';

const regularRequestContextNoExtension = {
  creator: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: arbitraryExpectedAmount,
  payee: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  payer: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: payerRaw.address,
  },
  requestId: requestIdMock,
  state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
  version: CURRENT_VERSION,
};

const extensions = [{ id: 'extension1', value: 'whatever' }];
const regularRequestContextWithExtensions = {
  creator: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: arbitraryExpectedAmount,
  extensions,
  payee: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  payer: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: payerRaw.address,
  },
  requestId: requestIdMock,
  state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
  version: CURRENT_VERSION,
};

/* tslint:disable:no-unused-expression */
describe('requestLogic.applyTransactionToRequest(ReduceExpectedAmount)', () => {
  it('can reduce expected amount by payee', () => {
    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey },
    );

    const request = RequestLogic.applyTransactionToRequest(
      txReduceAmount,
      regularRequestContextNoExtension,
    );

    expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
      arbitraryExpectedAmountAfterDelta,
    );
    expect(request.extensions, 'extensions is wrong').to.be.undefined;

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payeeRaw.address);

    expect(request, 'request.payee is wrong').to.have.property('payee');
    if (request.payee) {
      expect(request.payee.type, 'request.payee.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payee.value, 'request.payee.value is wrong').to.equal(payeeRaw.address);
    }
    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
  });

  it('cannot reduce expected amount by payer', () => {
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payerRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        txReduceAmount,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('signer must be the payee');
    }
  });

  it('cannot reduce expected amount by thirdparty', () => {
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: otherIdRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        txReduceAmount,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('signer must be the payee');
    }
  });

  it('cannot reduce expected amount if no requestId', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmount,
          },
          version: CURRENT_VERSION,
        },
      };
      const request = RequestLogic.applyTransactionToRequest(
        signedTx,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('requestId must be given');
    }
  });

  it('cannot reduce expected amount if no deltaAmount', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            requestId: requestIdMock,
          },
          version: CURRENT_VERSION,
        },
      };
      const request = RequestLogic.applyTransactionToRequest(
        signedTx,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('deltaAmount must be given');
    }
  });

  it('cannot reduce expected amount with no state', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          version: CURRENT_VERSION,
        },
      };
      const request = RequestLogic.applyTransactionToRequest(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('request is expected');
    }
  });
  it('cannot reduce expected amount if no payee in state', () => {
    const requestContextNoPayer = {
      creator: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      expectedAmount: arbitraryExpectedAmount,
      payer: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      requestId: requestIdMock,
      state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
      version: CURRENT_VERSION,
    };
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          version: CURRENT_VERSION,
        },
      };
      const request = RequestLogic.applyTransactionToRequest(signedTx, requestContextNoPayer);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('the request must have a payee');
    }
  });

  it('cannot reduce expected amount if state === CANCELLED in state', () => {
    const requestContextCancelled = {
      creator: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      expectedAmount: arbitraryExpectedAmount,
      payee: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      payer: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payerRaw.address,
      },
      requestId: requestIdMock,
      state: RequestEnum.REQUEST_LOGIC_STATE.CANCELLED,
      version: CURRENT_VERSION,
    };
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payeeRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        txReduceAmount,
        requestContextCancelled,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('the request must not be cancelled');
    }
  });

  it('can reduce expected amount if state === ACCEPTED in state', () => {
    const requestContextAccepted = {
      creator: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      expectedAmount: arbitraryExpectedAmount,
      payee: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      payer: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payerRaw.address,
      },
      requestId: requestIdMock,
      state: RequestEnum.REQUEST_LOGIC_STATE.ACCEPTED,
      version: CURRENT_VERSION,
    };

    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        requestId: requestIdMock,
      },
      {
        method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: payeeRaw.privateKey,
      },
    );

    const request = RequestLogic.applyTransactionToRequest(txReduceAmount, requestContextAccepted);

    expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.ACCEPTED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
      arbitraryExpectedAmountAfterDelta,
    );
    expect(request.extensions, 'extensions is wrong').to.be.undefined;

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payeeRaw.address);

    expect(request, 'request.payee is wrong').to.have.property('payee');
    if (request.payee) {
      expect(request.payee.type, 'request.payee.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payee.value, 'request.payee.value is wrong').to.equal(payeeRaw.address);
    }
    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
  });

  it('can reduce expected amount with extensions and no extensions before', () => {
    const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        extensions: newExtensionsData,
        requestId: requestIdMock,
      },
      {
        method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: payeeRaw.privateKey,
      },
    );

    const request = RequestLogic.applyTransactionToRequest(
      txReduceAmount,
      regularRequestContextNoExtension,
    );

    expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
      arbitraryExpectedAmountAfterDelta,
    );
    expect(request.extensions, 'request.extensions is wrong').to.deep.equal(newExtensionsData);

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payeeRaw.address);

    expect(request, 'request.payee is wrong').to.have.property('payee');
    if (request.payee) {
      expect(request.payee.type, 'request.payee.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payee.value, 'request.payee.value is wrong').to.equal(payeeRaw.address);
    }
    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
  });

  it('can reduce expected amount with extensions and extensions before', () => {
    const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        extensions: newExtensionsData,
        requestId: requestIdMock,
      },
      {
        method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: payeeRaw.privateKey,
      },
    );

    const request = RequestLogic.applyTransactionToRequest(
      txReduceAmount,
      regularRequestContextWithExtensions,
    );

    expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
      arbitraryExpectedAmountAfterDelta,
    );
    expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
      extensions.concat(newExtensionsData),
    );

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payeeRaw.address);

    expect(request, 'request.payee is wrong').to.have.property('payee');
    if (request.payee) {
      expect(request.payee.type, 'request.payee.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payee.value, 'request.payee.value is wrong').to.equal(payeeRaw.address);
    }
    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
  });
  it('can reduce expected amount without extensions and extensions before', () => {
    const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryDeltaAmount,
        requestId: requestIdMock,
      },
      {
        method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: payeeRaw.privateKey,
      },
    );

    const request = RequestLogic.applyTransactionToRequest(
      txReduceAmount,
      regularRequestContextWithExtensions,
    );

    expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
      arbitraryExpectedAmountAfterDelta,
    );
    expect(request.extensions, 'request.extensions is wrong').to.deep.equal(extensions);

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payeeRaw.address);

    expect(request, 'request.payee is wrong').to.have.property('payee');
    if (request.payee) {
      expect(request.payee.type, 'request.payee.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payee.value, 'request.payee.value is wrong').to.equal(payeeRaw.address);
    }
    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
  });

  it('cannot reduce expected amount with a negative amount', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmountNegative,
            requestId: requestIdMock,
          },
          version: CURRENT_VERSION,
        },
      };

      const request = RequestLogic.applyTransactionToRequest(
        signedTx,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'deltaAmount must be a string representing a positive integer',
      );
    }
  });

  it('cannot reduce expected amount with not a number', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: 'Not a number',
            requestId: requestIdMock,
          },
          version: CURRENT_VERSION,
        },
      };

      const request = RequestLogic.applyTransactionToRequest(
        signedTx,
        regularRequestContextNoExtension,
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
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '0.0234',
            requestId: requestIdMock,
          },
          version: CURRENT_VERSION,
        },
      };

      const request = RequestLogic.applyTransactionToRequest(
        signedTx,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'deltaAmount must be a string representing a positive integer',
      );
    }
  });

  it('can reduce expected amount to zero', () => {
    const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
      {
        deltaAmount: arbitraryExpectedAmount,
        requestId: requestIdMock,
      },
      {
        method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: payeeRaw.privateKey,
      },
    );

    const request = RequestLogic.applyTransactionToRequest(
      txReduceAmount,
      regularRequestContextNoExtension,
    );

    expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal('0');
    expect(request.extensions, 'extensions is wrong').to.be.undefined;

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payeeRaw.address);

    expect(request, 'request.payee is wrong').to.have.property('payee');
    if (request.payee) {
      expect(request.payee.type, 'request.payee.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payee.value, 'request.payee.value is wrong').to.equal(payeeRaw.address);
    }
    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
  });

  it('cannot reduce expected amount below zero', () => {
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: biggerThanArbitraryExpectedAmount,
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payeeRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        txReduceAmount,
        regularRequestContextNoExtension,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('result of reduce is not valid');
    }
  });

  it('cannot reduce expected amount with wrong state', () => {
    const regularRequestContextWithErrors = {
      creator: {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      expectedAmount: '-1000',
      requestId: requestIdMock,
      state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
      version: CURRENT_VERSION,
    };
    try {
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payeeRaw.privateKey,
        },
      );
      const request = RequestLogic.applyTransactionToRequest(
        txReduceAmount,
        regularRequestContextWithErrors,
      );

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'request.payee or/and request.payer are missing',
      );
    }
  });
});
