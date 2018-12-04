import { expect } from 'chai';
import 'mocha';

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import RequestLogic from '../../src/requestLogicCore';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('requestLogicCore', () => {
  describe('applyActionToRequest', () => {
    it('cannot support unknown action', () => {
      try {
        const action: any = {
          data: {
            name: 'actionUnknown',
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        RequestLogic.applyActionToRequest(
          Utils.deepCopy(TestData.requestCreatedNoExtension),
          action,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('Unknown action actionUnknown');
      }
    });
    it('does not support all versions', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: '2.0.0',
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        RequestLogic.applyActionToRequest(null, action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('action version not supported');
      }
    });

    it('cannot apply accept with no state', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        RequestLogic.applyActionToRequest(null, action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });

    it('cannot apply accept with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
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
        const actionAccept = RequestLogic.formatAccept(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        RequestLogic.applyActionToRequest(regularRequestContextWithErrors, actionAccept);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });

    it('cannot cancel with no state', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CANCEL,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        RequestLogic.applyActionToRequest(null, action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });

    it('cannot cancel with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
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
        const actionCancel = RequestLogic.formatCancel(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );
        RequestLogic.applyActionToRequest(regularRequestContextWithErrors, actionCancel);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });

    it('cannot increase expected amount with no state', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: TestData.arbitraryDeltaAmount,
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        RequestLogic.applyActionToRequest(null, action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });

    it('cannot increase expected amount with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
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
        const actionIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
          {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        RequestLogic.applyActionToRequest(regularRequestContextWithErrors, actionIncreaseAmount);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });
    it('cannot reduce expected amount with no state', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: TestData.arbitraryDeltaAmount,
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        RequestLogic.applyActionToRequest(null, action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request is expected');
      }
    });
    it('cannot reduce expected amount with wrong state', () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
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
        const actionReduceAmount = RequestLogic.formatReduceExpectedAmount(
          {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        RequestLogic.applyActionToRequest(regularRequestContextWithErrors, actionReduceAmount);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });
    it('it cannot apply creation with a state', () => {
      try {
        const actionCreation = RequestLogic.formatCreate(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        const requestState = {
          creator: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
          },
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
          },
          requestId: '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8',
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        RequestLogic.applyActionToRequest(requestState, actionCreation);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'no request is expected at the creation',
        );
      }
    });

    it('can apply creaion with only the payee', () => {
      const paramsCreate = {
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
      };
      const actionCreation = RequestLogic.formatCreate(paramsCreate, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });

      const request = RequestLogic.applyActionToRequest(null, actionCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash({
          name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
          parameters: paramsCreate,
          version: CURRENT_VERSION,
        }),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request.payer, 'payer is wrong').to.be.undefined;
    });

    it('can apply accept by payer', () => {
      const actionAccept = RequestLogic.formatAccept(
        { requestId: TestData.requestIdMock },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = RequestLogic.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionAccept,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });

    it('can cancel by payer with state === created', () => {
      const actionCancel = RequestLogic.formatCancel(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );
      const request = RequestLogic.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionCancel,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });

    it('can increase expected amount by payer', () => {
      const arbitraryDeltaAmount = '100000000000000000';
      const arbitraryExpectedAmountAfterDelta = '223400000000000000';
      const actionIncreaseAmount = RequestLogic.formatIncreaseExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = RequestLogic.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionIncreaseAmount,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });

    it('can reduce expected amount by payee', () => {
      const arbitraryDeltaAmount = '100000000000000000';
      const arbitraryExpectedAmountAfterDelta = '23400000000000000';
      const actionReduceAmount = RequestLogic.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = RequestLogic.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionReduceAmount,
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
    });
  });
});
