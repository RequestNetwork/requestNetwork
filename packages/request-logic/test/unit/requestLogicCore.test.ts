import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import RequestLogic from '../../src/requestLogicCore';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('requestLogicCore', () => {
  describe('applyTransactionToRequest', () => {
    it('cannot support unknown action', () => {
      try {
        const signedTx: any = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: 'actionUnknown',
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
        };

        const request = RequestLogic.applyTransactionToRequest(
          Utils.deepCopy(TestData.requestCreatedNoExtension),
          signedTx,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('Unknown action actionUnknown');
      }
    });
    it('does not support all versions', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: '2.0.0',
          },
        };

        const request = RequestLogic.applyTransactionToRequest(null, signedTx);

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
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
        };
        const request = RequestLogic.applyTransactionToRequest(null, signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });

    it('cannot apply accept with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [],
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txAccept = RequestLogic.formatAccept(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          regularRequestContextWithErrors,
          txAccept,
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
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CANCEL,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
        };
        const request = RequestLogic.applyTransactionToRequest(null, signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });

    it('cannot cancel with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [],
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txCancel = RequestLogic.formatCancel(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          regularRequestContextWithErrors,
          txCancel,
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
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: TestData.arbitraryDeltaAmount,
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
        };
        const request = RequestLogic.applyTransactionToRequest(null, signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });

    it('cannot increase expected amount with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [],
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
          {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          regularRequestContextWithErrors,
          txIncreaseAmount,
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
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: TestData.arbitraryDeltaAmount,
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
        };
        const request = RequestLogic.applyTransactionToRequest(null, signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });
    it('cannot reduce expected amount with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [],
        expectedAmount: '-1000',
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
          {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        const request = RequestLogic.applyTransactionToRequest(
          regularRequestContextWithErrors,
          txReduceAmount,
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
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const requestState = {
          creator: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
          },
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
          },
          requestId: '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8',
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        const request = RequestLogic.applyTransactionToRequest(requestState, txCreation);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'no request is expected at the creation',
        );
      }
    });

    it('can apply creaion with only the payee', () => {
      const txCreation = RequestLogic.formatCreate(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(null, txCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request.payer, 'payer is wrong').to.be.undefined;
    });

    it('can apply accept by payer', () => {
      const txAccept = RequestLogic.formatAccept(
        { requestId: TestData.requestIdMock },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        txAccept,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });

    it('can cancel by payer with state === created', () => {
      const txCancel = RequestLogic.formatCancel(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );
      const request = RequestLogic.applyTransactionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        txCancel,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });

    it('can increase expected amount by payer', () => {
      const arbitraryDeltaAmount = '100000000000000000';
      const arbitraryExpectedAmountAfterDelta = '223400000000000000';
      const txIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        txIncreaseAmount,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });

    it('can reduce expected amount by payee', () => {
      const arbitraryDeltaAmount = '100000000000000000';
      const arbitraryExpectedAmountAfterDelta = '23400000000000000';
      const txReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = RequestLogic.applyTransactionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        txReduceAmount,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });
  });
});
