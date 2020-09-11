import { IdentityTypes, RequestLogicTypes, SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AddExtensionsDataAction from '../../../src/actions/addExtensionsData';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('actions/addExtensionsData', () => {
  describe('format', () => {
    it('can formatAddExtensionsData without extensionsData', () => {
      // 'should throw'
      expect(() => {
        AddExtensionsDataAction.format(
          {
            requestId: TestData.requestIdMock,
          } as any,
          TestData.payerRaw.identity,
          TestData.fakeSignatureProviderArbitrary,
        );
      }).toThrowError('extensionsData must be given');
    });

    it('can formatAddExtensionsData with extensionsData empty', () => {
      // 'should throw'
      expect(() => {
        AddExtensionsDataAction.format(
          {
            extensionsData: [],
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProviderArbitrary,
        );
      }).toThrowError('extensionsData must be given');
    });

    it('can formatAddExtensionsData with extensionsData', async () => {
      const actionAddExtensionsData = await AddExtensionsDataAction.format(
        {
          extensionsData: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProviderArbitrary,
      );
      // 'action is wrong'
      expect(actionAddExtensionsData.data.name).toBe(RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA);

      // 'requestId is wrong'
      expect(actionAddExtensionsData.data.parameters.requestId).toBe(TestData.requestIdMock);
      // 'extensionsData is wrong'
      expect(actionAddExtensionsData.data.parameters.extensionsData).toEqual(TestData.oneExtension);

      // 'actionAddExtensionsData.signature.value'
      expect(actionAddExtensionsData.signature).toEqual(TestData.fakeSignature);
    });
  });

  describe('applyActionToRequest', () => {
    it('can apply addExtensionsData', async () => {
      const actionAddExtensionsData = await AddExtensionsDataAction.format(
        {
          extensionsData: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = AddExtensionsDataAction.applyActionToRequest(
        actionAddExtensionsData,
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
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
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
        name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
        parameters: { extensionsDataLength: 1 },
        timestamp: 2,
      });
    });

    it('cannot apply addExtensionsData if no requestId', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
          parameters: { extensionsData: TestData.oneExtension },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };
      expect(() =>
        AddExtensionsDataAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('requestId must be given');
    });

    it('cannot apply addExtensionsData if no extensionsData', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
          parameters: { requestId: TestData.requestIdMock },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };
      expect(() =>
        AddExtensionsDataAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('extensionsData must be given');
    });

    it('cannot apply addExtensionsData if extensionsData empty', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
          parameters: { extensionsData: [], requestId: TestData.requestIdMock },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.METHOD.ECDSA,
          value:
            '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
        },
      };
      expect(() =>
        AddExtensionsDataAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).toThrowError('extensionsData must be given');
    });

    it(
      'can apply addExtensionsData with extensionsData and no extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionAddExtensionsData = await AddExtensionsDataAction.format(
          {
            extensionsData: newExtensionsData,
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = AddExtensionsDataAction.applyActionToRequest(
          actionAddExtensionsData,
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
        expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
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
          name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
      }
    );

    it(
      'can apply addExtensionsData with extensionsData and extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionAddExtensionsData = await AddExtensionsDataAction.format(
          {
            extensionsData: newExtensionsData,
            requestId: TestData.requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        );
        const request = AddExtensionsDataAction.applyActionToRequest(
          actionAddExtensionsData,
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
        expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
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
          name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
      }
    );
  });
});
