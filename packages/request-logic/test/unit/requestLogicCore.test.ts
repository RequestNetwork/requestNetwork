import MultiFormat from '@requestnetwork/multi-format';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

import RequestLogicCore from '../../src/requestLogicCore';

const fakeAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: (
    extensionStates: RequestLogicTypes.IExtensionStates,
  ): RequestLogicTypes.IExtensionStates => extensionStates,
  extensions: {},
};

/* tslint:disable:no-unused-expression */
describe('requestLogicCore', () => {
  describe('applyActionToRequest', () => {
    it('cannot support unknown action', () => {
      const action: any = {
        data: {
          name: 'actionUnknown',
          parameters: {
            currency: 'ETH',
            expectedAmount: TestData.arbitraryExpectedAmount,
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
            payer: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };

      expect(() =>
        RequestLogicCore.applyActionToRequest(
          Utils.deepCopy(TestData.requestCreatedNoExtension),
          action,
          2,
          fakeAdvancedLogic,
        ),
      ).toThrowError('Unknown action actionUnknown');
    });
    it('does not support all versions', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: TestData.arbitraryExpectedAmount,
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
            payer: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
          version: '99.99.99',
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };

      expect(() =>
        RequestLogicCore.applyActionToRequest(null, action, 2, fakeAdvancedLogic),
      ).toThrowError('action version not supported');
    });

    it('cannot apply accept with no state', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId: TestData.requestIdMock,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };
      expect(() =>
        RequestLogicCore.applyActionToRequest(null, action, 2, fakeAdvancedLogic),
      ).toThrowError('request is expected');
    });

    it('cannot apply accept with wrong state', async () => {
      const regularRequestContextWithErrors: RequestLogicTypes.IRequest = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: '-1000',
        extensions: {},
        extensionsData: [],
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const actionAccept = await RequestLogicCore.formatAccept(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() =>
        RequestLogicCore.applyActionToRequest(
          regularRequestContextWithErrors,
          actionAccept,
          2,
          fakeAdvancedLogic,
        ),
      ).toThrowError('request.payee and request.payer are missing');
    });

    it('cannot cancel with no state', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: {
            requestId: TestData.requestIdMock,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };

      expect(() =>
        RequestLogicCore.applyActionToRequest(null, action, 2, fakeAdvancedLogic),
      ).toThrowError('request is expected');
    });

    it('cannot cancel with wrong state', async () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: '-1000',
        extensions: {},
        extensionsData: [],
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const actionCancel = await RequestLogicCore.formatCancel(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.otherIdRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() =>
        RequestLogicCore.applyActionToRequest(
          regularRequestContextWithErrors,
          actionCancel,
          2,
          fakeAdvancedLogic,
        ),
      ).toThrowError('request.payee and request.payer are missing');
    });

    it('cannot increase expected amount with no state', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };

      expect(() =>
        RequestLogicCore.applyActionToRequest(null, action, 2, fakeAdvancedLogic),
      ).toThrowError('request is expected');
    });

    it('cannot increase expected amount with wrong state', async () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: '-1000',
        extensions: {},
        extensionsData: [],
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const actionIncreaseAmount = await RequestLogicCore.formatIncreaseExpectedAmount(
        {
          deltaAmount: TestData.arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() =>
        RequestLogicCore.applyActionToRequest(
          regularRequestContextWithErrors,
          actionIncreaseAmount,
          2,
          fakeAdvancedLogic,
        ),
      ).toThrowError('request.payee and request.payer are missing');
    });
    it('cannot reduce expected amount with no state', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: TestData.arbitraryDeltaAmount,
            requestId: TestData.requestIdMock,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };
      expect(() =>
        RequestLogicCore.applyActionToRequest(null, action, 2, fakeAdvancedLogic),
      ).toThrowError('request is expected');
    });
    it('cannot reduce expected amount with wrong state', async () => {
      const regularRequestContextWithErrors = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: '-1000',
        extensions: {},
        extensionsData: [],
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const actionReduceAmount = await RequestLogicCore.formatReduceExpectedAmount(
        {
          deltaAmount: TestData.arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() =>
        RequestLogicCore.applyActionToRequest(
          regularRequestContextWithErrors,
          actionReduceAmount,
          2,
          fakeAdvancedLogic,
        ),
      ).toThrowError('request.payee and request.payer are missing');
    });
    it('it cannot apply creation with a state', async () => {
      const actionCreation = await RequestLogicCore.formatCreate(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      const requestState = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
        },
        requestId: '011c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8',
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() =>
        RequestLogicCore.applyActionToRequest(requestState, actionCreation, 2, fakeAdvancedLogic),
      ).toThrowError('no request is expected at the creation');
    });

    it('can apply creation with only the payee', async () => {
      const paramsCreate = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensionsData: [
          {
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: { content: { what: 'ever', it: 'is' } },
            type: ExtensionTypes.TYPE.CONTENT_DATA,
          },
        ],
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
      };
      const actionCreation = await RequestLogicCore.formatCreate(
        paramsCreate,
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = RequestLogicCore.applyActionToRequest(
        null,
        actionCreation,
        2,
        fakeAdvancedLogic,
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)));
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'payer is wrong'
      expect(request.payer).toBeUndefined();
    });
    it('can apply accept by payer', async () => {
      const actionAccept = await RequestLogicCore.formatAccept(
        { requestId: TestData.requestIdMock },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = RequestLogicCore.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionAccept,
        2,
        fakeAdvancedLogic,
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(TestData.requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request should have property payer'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
    });

    it('can cancel by payer with state === created', async () => {
      const actionCancel = await RequestLogicCore.formatCancel(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      const request = RequestLogicCore.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionCancel,
        2,
        fakeAdvancedLogic,
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(TestData.requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CANCELED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request should have property payer'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
    });

    it('can increase expected amount by payer', async () => {
      const arbitraryDeltaAmount = '100000000000000000';
      const arbitraryExpectedAmountAfterDelta = '223400000000000000';
      const actionIncreaseAmount = await RequestLogicCore.formatIncreaseExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = RequestLogicCore.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionIncreaseAmount,
        2,
        fakeAdvancedLogic,
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(TestData.requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request.creator is wrong'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request.payee is wrong'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request.payer is wrong'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
    });

    it('can reduce expected amount by payee', async () => {
      const arbitraryDeltaAmount = '100000000000000000';
      const arbitraryExpectedAmountAfterDelta = '23400000000000000';
      const actionReduceAmount = await RequestLogicCore.formatReduceExpectedAmount(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: TestData.requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = RequestLogicCore.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionReduceAmount,
        2,
        fakeAdvancedLogic,
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(TestData.requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request.creator is wrong'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request.payee is wrong'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request.payer is wrong'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
    });

    it('can apply add extensions data to a request', async () => {
      const actionAddExtensionsData = await RequestLogicCore.formatAddExtensionsData(
        { requestId: TestData.requestIdMock, extensionsData: TestData.oneExtension },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = RequestLogicCore.applyActionToRequest(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        actionAddExtensionsData,
        2,
        fakeAdvancedLogic,
      );

      // 'extensions is wrong'
      expect(request.extensionsData).toEqual(TestData.oneExtension);
    });
  });
});
