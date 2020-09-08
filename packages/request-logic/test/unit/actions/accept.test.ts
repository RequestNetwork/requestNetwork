import { expect } from 'chai';

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
      expect(actionAccept.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.ACCEPT,
      );

      expect(actionAccept.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(actionAccept.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
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
      expect(actionAccept.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.ACCEPT,
      );

      expect(actionAccept.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(actionAccept.data.parameters.extensionsData, 'extensionsData is wrong').to.deep.equal(
        TestData.oneExtension,
      );
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

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.ACCEPTED);
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

      expect(() => {
        AcceptAction.applyActionToRequest(
          actionAccept,
          1,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }, 'should throw').to.throw('Signer must be the payer');
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
      ).to.throw('Signer must be the payer');
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
      ).to.throw('requestId must be given');
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

      expect(() => AcceptAction.applyActionToRequest(action, 2, requestContextNoPayer)).to.throw(
        'the request must have a payer',
      );
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
      ).to.throw('the request state must be created');
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
      ).to.throw('the request state must be created');
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

        expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
        expect(request.currency, 'currency is wrong').to.deep.equal({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.ACCEPTED);
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

        expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
        expect(request.currency, 'currency is wrong').to.deep.equal({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.ACCEPTED);
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

        expect(request.events[1], 'request.events is wrong').to.deep.equal({
          actionSigner: TestData.payerRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: { extensionsDataLength: 1 },
          timestamp: 2,
        });
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

        expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
        expect(request.currency, 'currency is wrong').to.deep.equal({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.ACCEPTED);
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
      }
    );
  });
});
