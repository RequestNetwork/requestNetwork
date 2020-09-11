import { IdentityTypes, RequestLogicTypes, SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AcceptAction from '../../../src/actions/accept';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('actions/accept', () => {
  describe('format', () => {
    it('can formatAccept without extensionsData', async () => {
      const actionAccept = await AcceptAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'action is wrong'
      expect(actionAccept.data.name).toBe(RequestLogicTypes.ACTION_NAME.ACCEPT);

      // 'requestId is wrong'
      expect(actionAccept.data.parameters.requestId).toBe(TestData.requestIdMock);
      // 'extensionsData is wrong'
      expect(actionAccept.data.parameters.extensionsData).toBeUndefined();
    });

    it('can formatAccept with extensionsData', async () => {
      const actionAccept = await AcceptAction.format(
        {
          extensionsData: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'action is wrong'
      expect(actionAccept.data.name).toBe(RequestLogicTypes.ACTION_NAME.ACCEPT);

      // 'requestId is wrong'
      expect(actionAccept.data.parameters.requestId).toBe(TestData.requestIdMock);
      // 'extensionsData is wrong'
      expect(actionAccept.data.parameters.extensionsData).toEqual(TestData.oneExtension);
    });
  });

  describe('applyActionToRequest', () => {
    it('can apply accept by payer', async () => {
      const actionAccept = await AcceptAction.format(
        { requestId: TestData.requestIdMock },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = AcceptAction.applyActionToRequest(
        actionAccept,
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
      // 'request.events is wrong'
      expect(request.events[1]).toEqual({
        actionSigner: TestData.payerRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.ACCEPT,
        parameters: { extensionsDataLength: 0 },
        timestamp: 2,
      });
    });

    it('cannot apply accept by payee', async () => {
      const actionAccept = await AcceptAction.format(
        { requestId: TestData.requestIdMock },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'should throw'
      expect(() => {
        AcceptAction.applyActionToRequest(
          actionAccept,
          1,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('Signer must be the payer');
    });
    it('cannot apply accept by third party', async () => {
      const actionAccept = await AcceptAction.format(
        { requestId: TestData.requestIdMock },
        TestData.otherIdRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        AcceptAction.applyActionToRequest(
          actionAccept,
          1,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('Signer must be the payer');
    });

    it('cannot apply accept if no requestId', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
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
        AcceptAction.applyActionToRequest(
          action,
          1,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('requestId must be given');
    });

    it('cannot apply accept if no payer in state', () => {
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

      expect(() => AcceptAction.applyActionToRequest(action, 2, requestContextNoPayer)).toThrowError('the request must have a payer');
    });
    it('cannot apply accept if state === CANCELED in state', () => {
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
        AcceptAction.applyActionToRequest(
          action,
          1,
          Utils.deepCopy(TestData.requestCanceledNoExtension),
        ),
      ).toThrowError('the request state must be created');
    });

    it('cannot apply accept if state === ACCEPTED in state', () => {
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
        AcceptAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCanceledNoExtension),
        ),
      ).toThrowError('the request state must be created');
    });

    it(
      'can apply accept with extensionsData and no extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionAccept = await AcceptAction.format(
          {
            extensionsData: newExtensionsData,
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = AcceptAction.applyActionToRequest(
          actionAccept,
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
        expect(request.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
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
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
      }
    );

    it(
      'can apply accept with extensionsData and extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionAccept = await AcceptAction.format(
          {
            extensionsData: newExtensionsData,
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );
        const request = AcceptAction.applyActionToRequest(
          actionAccept,
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
        expect(request.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
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

        // 'request.events is wrong'
        expect(request.events[1]).toEqual({
          actionSigner: TestData.payerRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
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
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
      }
    );
    it(
      'can apply accept without extensionsData and extensionsData before',
      async () => {
        const actionAccept = await AcceptAction.format(
          {
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = AcceptAction.applyActionToRequest(
          actionAccept,
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
        expect(request.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
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
      }
    );
  });
});
