import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');
import Utils from '@requestnetwork/utils';
import * as RequestEnum from '../../src/enum';
import RequestLogic from '../../src/requestLogic';
import * as Types from '../../src/types';

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

const arbitraryExpectedAmount = '123400000000000000';

/* tslint:disable:no-unused-expression */
describe('requestLogic.applyTransactionToRequestState(Creation)', () => {
  it('can create with only the payee', () => {
    const txCreation = RequestLogic.formatCreate(
      {
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: arbitraryExpectedAmount,
        payee: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: payeeRaw.address,
        },
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey },
    );

    const request = RequestLogic.applyTransactionToRequestState(txCreation);
    expect(request.requestId, 'requestId is wrong').to.equal(
      Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
    );
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
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
    expect(request.payer, 'payer is wrong').to.be.undefined;
  });

  it('can create with only the payer', () => {
    const txCreation = RequestLogic.formatCreate(
      {
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: arbitraryExpectedAmount,
        payer: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: payerRaw.address,
        },
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    const request = RequestLogic.applyTransactionToRequestState(txCreation);
    expect(request.requestId, 'requestId is wrong').to.equal(
      Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
    );
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.ACCEPTED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
    expect(request.extensions, 'extensions is wrong').to.be.undefined;

    expect(request, 'request.creator is wrong').to.have.property('creator');
    expect(request.creator.type, 'request.creator.type is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    );
    expect(request.creator.value, 'request.creator.value is wrong').to.equal(payerRaw.address);

    expect(request, 'request.payer is wrong').to.have.property('payer');
    if (request.payer) {
      expect(request.payer.type, 'request.payer.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.payer.value, 'request.payer.value is wrong').to.equal(payerRaw.address);
    }
    expect(request.payee, 'payee is wrong').to.be.undefined;
  });

  it('can create with the payee and the payer', () => {
    const txCreation = RequestLogic.formatCreate(
      {
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
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey },
    );

    const request = RequestLogic.applyTransactionToRequestState(txCreation);
    expect(request.requestId, 'requestId is wrong').to.equal(
      Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
    );
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
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

  it('cannot create without payee and payer', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: arbitraryExpectedAmount,
            extensions: [{ id: 'extension1', value: 'whatever' }],
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'transaction.parameters.payee or transaction.parameters.payer must be given',
      );
    }
  });

  it('cannot create with amount not a number', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: 'Not a Number',
            extensions: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'transaction.parameters.expectedAmount must be a string representing a positive integer',
      );
    }
  });

  it('cannot create with amount decimal', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: '0.1234',
            extensions: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'transaction.parameters.expectedAmount must be a string representing a positive integer',
      );
    }
  });

  it('cannot create with amount negative', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: '-100000000000',
            extensions: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'transaction.parameters.expectedAmount must be a string representing a positive integer',
      );
    }
  });

  it('can create with extensions', () => {
    const extensions = [{ id: 'extension1', value: 'whatever' }];
    const txCreation = RequestLogic.formatCreate(
      {
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
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey },
    );

    const request = RequestLogic.applyTransactionToRequestState(txCreation);
    expect(request.requestId, 'requestId is wrong').to.equal(
      Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
    );
    expect(request.currency, 'currency is wrong').to.equal(RequestEnum.REQUEST_LOGIC_CURRENCY.ETH);
    expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CREATED);
    expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(arbitraryExpectedAmount);
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

  it('cannot sign with ECDSA by another', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value: '0x' + 'a'.repeat(130),
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: arbitraryExpectedAmount,
            extensions: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('Signer must be the payee or the payer');
    }
  });

  it('does not support other identity type than "ethereumAddress" for Payee', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: arbitraryExpectedAmount,
            extensions: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'not_ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('Signer must be the payee or the payer');
    }
  });

  it('does not support other identity type than "ethereumAddress" for Payer', () => {
    try {
      const signedTx = {
        signature: {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
        transaction: {
          action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: arbitraryExpectedAmount,
            extensions: [{ id: 'extension1', value: 'whatever' }],
            payer: {
              type: 'not_ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
        },
      };

      const request = RequestLogic.applyTransactionToRequestState(signedTx);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal('Signer must be the payee or the payer');
    }
  });

  it('it cannot apply creation with a state', () => {
    try {
      const txCreation = RequestLogic.formatCreate(
        {
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
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: payerRaw.privateKey,
        },
      );
      const requestState = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: arbitraryExpectedAmount,
        payer: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
        },
        requestId: '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8',
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
      };
      const request = RequestLogic.applyTransactionToRequestState(txCreation, requestState);

      expect(false, 'exception not thrown').to.be.true;
    } catch (e) {
      expect(e.message, 'exception not right').to.be.equal(
        'no request state is expected at the creation',
      );
    }
  });
});
