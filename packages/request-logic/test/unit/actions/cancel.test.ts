import { expect } from 'chai';
import 'mocha';

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
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

      expect(actionCancel.data.name, 'action is wrong').to.equal(Types.ACTION_NAME.CANCEL);

      expect(actionCancel.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(actionCancel.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
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

      expect(actionCancel.data.name, 'action is wrong').to.equal(Types.ACTION_NAME.CANCEL);

      expect(actionCancel.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(actionCancel.data.parameters.extensionsData, 'extensionsData is wrong').to.deep.equal(
        TestData.oneExtension,
      );
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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CANCELED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.deep.equal({});

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }

      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.ACTION_NAME.CANCEL,
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
      ).to.throw('A payer cancel need to be done on a request with the state created');
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
      ).to.throw('A payer cancel need to be done on a request with the state created');
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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CANCELED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.deep.equal({});

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: Types.ACTION_NAME.CANCEL,
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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CANCELED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.deep.equal({});

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[2], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: Types.ACTION_NAME.CANCEL,
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
      ).to.throw('Cannot cancel an already canceled request');
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
      ).to.throw('Signer must be the payer or the payee');
    });

    it('cannot cancel if no requestId', () => {
      const action = {
        data: {
          name: Types.ACTION_NAME.CANCEL,
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
      ).to.throw('requestId must be given');
    });
    it('cannot cancel by payer if no payer in state', () => {
      const requestContextNoPayer = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.CURRENCY.ETH,
        events: [
          {
            actionSigner: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            name: Types.ACTION_NAME.CREATE,
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
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const action = {
        data: {
          name: Types.ACTION_NAME.CANCEL,
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

      expect(() => CancelAction.applyActionToRequest(action, 2, requestContextNoPayer)).to.throw(
        'Signer must be the payer or the payee',
      );
    });
    it('cannot cancel by payee if no payee in state', () => {
      const requestContextNoPayee = {
        creator: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.CURRENCY.ETH,
        events: [
          {
            actionSigner: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            name: Types.ACTION_NAME.CREATE,
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
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const action = {
        data: {
          name: Types.ACTION_NAME.CANCEL,
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

      expect(() => CancelAction.applyActionToRequest(action, 2, requestContextNoPayee)).to.throw(
        'Signer must be the payer or the payee',
      );
    });
    it('can cancel with extensionsData and no extensionsData before', async () => {
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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CANCELED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        newExtensionsData,
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 1 },
        timestamp: 2,
      });
    });

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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CANCELED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        TestData.oneExtension.concat(newExtensionsData),
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 1 },
        timestamp: 2,
      });
    });
    it('can cancel without extensionsData and extensionsData before', async () => {
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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CANCELED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.ACTION_NAME.CANCEL,
        parameters: { extensionsDataLength: 0 },
        timestamp: 2,
      });
    });
  });
});
