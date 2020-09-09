import { IdentityTypes, RequestLogicTypes, SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import CancelAction from '../../../src/actions/cancel';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('actions/cancel', () => {
  describe('format', () => {
    it('can cancel without extensionsData', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionCancel.data.name).toBe(RequestLogicTypes.ACTION_NAME.CANCEL);

      // 'requestId is wrong'
      expect(actionCancel.data.parameters.requestId).toBe(TestData.requestIdMock);
      // 'extensionsData is wrong'
      expect(actionCancel.data.parameters.extensionsData).toBeUndefined();
    });

    it('can cancel with extensionsData', async () => {
      const actionCancel = await CancelAction.format(
        {
          extensionsData: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionCancel.data.name).toBe(RequestLogicTypes.ACTION_NAME.CANCEL);

      // 'requestId is wrong'
      expect(actionCancel.data.parameters.requestId).toBe(TestData.requestIdMock);
      // 'extensionsData is wrong'
      expect(actionCancel.data.parameters.extensionsData).toEqual(TestData.oneExtension);
    });
  });

  describe('applyActionToRequest', () => {
    it('can cancel by payer with state === created', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      const request = CancelAction.applyActionToRequest(
        actionCancel,
        2,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
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

      // 'request.events is wrong'
      expect(request.events[1]).toEqual({
        actionSigner: TestData.payerRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 0 },
        timestamp: 2,
      });
    });
    it('cannot cancel by payer with state === accepted', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        CancelAction.applyActionToRequest(
          actionCancel,
          2,
          Utils.deepCopy(TestData.requestAcceptedNoExtension),
        ),
      ).toThrowError('A payer cancel need to be done on a request with the state created');
    });
    it('cannot cancel by payer with state === canceled', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        CancelAction.applyActionToRequest(
          actionCancel,
          2,
          Utils.deepCopy(TestData.requestCanceledNoExtension),
        ),
      ).toThrowError('A payer cancel need to be done on a request with the state created');
    });

    it('can cancel by payee with state === created', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      const request = CancelAction.applyActionToRequest(
        actionCancel,
        2,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
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
      // 'request.events is wrong'
      expect(request.events[1]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 0 },
        timestamp: 2,
      });
    });
    it('can cancel by payee with state === accepted', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CancelAction.applyActionToRequest(
        actionCancel,
        2,
        Utils.deepCopy(TestData.requestAcceptedNoExtension),
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
      // 'request.events is wrong'
      expect(request.events[2]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 0 },
        timestamp: 2,
      });
    });
    it('cannot cancel by payee with state === canceled', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        CancelAction.applyActionToRequest(
          actionCancel,
          2,
          Utils.deepCopy(TestData.requestCanceledNoExtension),
        ),
      ).toThrowError('Cannot cancel an already canceled request');
    });

    it('cannot cancel by third party', async () => {
      const actionCancel = await CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.otherIdRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        CancelAction.applyActionToRequest(
          actionCancel,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('Signer must be the payer or the payee');
    });

    it('cannot cancel if no requestId', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: {},
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };

      expect(() =>
        CancelAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('requestId must be given');
    });
    it('cannot cancel by payer if no payer in state', () => {
      const requestContextNoPayer = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [
          {
            actionSigner: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsDataLength: 0,
              isSignedRequest: false,
            },
            timestamp: 1,
          },
        ],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
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

      expect(() => CancelAction.applyActionToRequest(action, 2, requestContextNoPayer)).toThrowError('Signer must be the payer or the payee');
    });
    it('cannot cancel by payee if no payee in state', () => {
      const requestContextNoPayee = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [
          {
            actionSigner: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsDataLength: 0,
              isSignedRequest: false,
            },
            timestamp: 1,
          },
        ],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
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

      expect(() => CancelAction.applyActionToRequest(action, 2, requestContextNoPayee)).toThrowError('Signer must be the payer or the payee');
    });
    it(
      'can cancel with extensionsData and no extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionCancel = await CancelAction.format(
          {
            extensionsData: newExtensionsData,
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = CancelAction.applyActionToRequest(
          actionCancel,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
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
        // 'request.extensionsData is wrong'
        expect(request.extensionsData).toEqual(newExtensionsData);

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
        // 'request.events is wrong'
        expect(request.events[1]).toEqual({
          actionSigner: TestData.payerRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
      }
    );

    it('can cancel with extensionsData and extensionsData before', async () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionCancel = await CancelAction.format(
        {
          extensionsData: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CancelAction.applyActionToRequest(
        actionCancel,
        2,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
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
      // 'request.extensionsData is wrong'
      expect(request.extensionsData).toEqual(TestData.oneExtension.concat(newExtensionsData));

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
      // 'request.events is wrong'
      expect(request.events[1]).toEqual({
        actionSigner: TestData.payerRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 1 },
        timestamp: 2,
      });
    });
    it(
      'can cancel without extensionsData and extensionsData before',
      async () => {
        const actionCancel = await CancelAction.format(
          {
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = CancelAction.applyActionToRequest(
          actionCancel,
          2,
          Utils.deepCopy(TestData.requestCreatedWithExtensions),
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
        // 'request.extensionsData is wrong'
        expect(request.extensionsData).toEqual(TestData.oneExtension);

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
        // 'request.events is wrong'
        expect(request.events[1]).toEqual({
          actionSigner: TestData.payerRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: { extensionsDataLength: 0 },
          timestamp: 2,
        });
      }
    );
  });
});
