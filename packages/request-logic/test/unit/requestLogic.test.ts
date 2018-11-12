import { expect } from 'chai';
import 'mocha';

import * as RequestEnum from '../../src/enum';
import RequestLogic from '../../src/requestLogic';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('requestLogic', () => {
  describe('applyTransactionToRequest', () => {
    it('does not support all versions', () => {
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
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: '2.0.0',
          },
        };

        const request = RequestLogic.applyTransactionToRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'signed transaction version not supported',
        );
      }
    });

    it('cannot apply accept with no state', () => {
      try {
        const signedTx = {
          signature: {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: RequestEnum.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              requestId: TestData.requestIdMock,
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
    it('cannot apply accept with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txAccept = RequestLogic.formatAccept(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          txAccept,
          regularRequestContextWithErrors,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });

    it('cannot cancel with no state', () => {
      try {
        const signedTx = {
          signature: {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
            parameters: {
              requestId: TestData.requestIdMock,
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

    it('cannot cancel with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txCancel = RequestLogic.formatCancel(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          txCancel,
          regularRequestContextWithErrors,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });

    it('cannot increase expected amount with no state', () => {
      try {
        const signedTx = {
          signature: {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: RequestEnum.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: TestData.arbitraryDeltaAmount,
              requestId: TestData.requestIdMock,
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

    it('cannot increase expected amount with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
          {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          txIncreaseAmount,
          regularRequestContextWithErrors,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
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
              deltaAmount: TestData.arbitraryDeltaAmount,
              requestId: TestData.requestIdMock,
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
    it('cannot reduce expected amount with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
          {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          txReduceAmount,
          regularRequestContextWithErrors,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });
    it('it cannot apply creation with a state', () => {
      try {
        const txCreation = RequestLogic.formatCreate(
          {
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const requestState = {
          creator: {
            type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
          },
          currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
          },
          requestId: '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8',
          state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        const request = RequestLogic.applyTransactionToRequest(txCreation, requestState);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'no request is expected at the creation',
        );
      }
    });
  });
});
