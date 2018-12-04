import { expect } from 'chai';
import 'mocha';

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AcceptAction from '../../../src/actions/accept';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('actions/accept', () => {
  describe('format', () => {
    it('can formatAccept without extensionsData', () => {
      const actionAccept = AcceptAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );
      expect(actionAccept.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
      );

      expect(actionAccept.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(actionAccept.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;

      expect(actionAccept, 'actionAccept.signature is wrong').to.have.property('signature');
      expect(actionAccept.signature.method, 'actionAccept.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(actionAccept.signature.value, 'actionAccept.signature.value').to.equal(
        '0x85982345e56cca13fd4f7110962cce7c2975421658f2babe801b52ab56f865a21ab3d1072d55ee443b986b52051e79b32f3c1cbcaa667a67051f708b43df35351c',
      );
    });

    it('can formatAccept with extensionsData', () => {
      const actionAccept = AcceptAction.format(
        {
          extensionsData: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );
      expect(actionAccept.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
      );

      expect(actionAccept.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(actionAccept.data.parameters.extensionsData, 'extensionsData is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(actionAccept, 'actionAccept.signature is wrong').to.have.property('signature');
      expect(actionAccept.signature.method, 'actionAccept.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(actionAccept.signature.value, 'actionAccept.signature.value').to.equal(
        '0xbeb95c95b2b09c026329f7219a00608fbe95ed7127cafab13063ba2ac14ad1ef4c7bbf55836f2aa658d1fdb9e55dc9f91cc11cb4a0bece116bf80ebc016159501c',
      );
    });
  });

  describe('applyActionToRequest', () => {
    it('can apply accept by payer', () => {
      const actionAccept = AcceptAction.format(
        { requestId: TestData.requestIdMock },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyActionToRequest(
        actionAccept,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
        parameters: { extensionsDataLength: 0 },
      });
    });

    it('cannot apply accept by payee', () => {
      try {
        const actionAccept = AcceptAction.format(
          { requestId: TestData.requestIdMock },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        AcceptAction.applyActionToRequest(
          actionAccept,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('Signer must be the payer');
      }
    });

    it('cannot apply accept by thirdparty', () => {
      try {
        const actionAccept = AcceptAction.format(
          { requestId: TestData.requestIdMock },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );

        AcceptAction.applyActionToRequest(
          actionAccept,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('Signer must be the payer');
      }
    });

    it('cannot apply accept if no requestId', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
            parameters: {},
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        AcceptAction.applyActionToRequest(
          action,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('requestId must be given');
      }
    });

    it('cannot apply accept if no payer in state', () => {
      const requestContextNoPayer = {
        creator: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [
          {
            actionSigner: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsDataLength: 0,
              isSignedRequest: false,
            },
          },
        ],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
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
        AcceptAction.applyActionToRequest(action, requestContextNoPayer);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must have a payer');
      }
    });
    it('cannot apply accept if state === CANCELLED in state', () => {
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
        AcceptAction.applyActionToRequest(
          action,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request state must be created');
      }
    });

    it('cannot apply accept if state === ACCEPTED in state', () => {
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
        AcceptAction.applyActionToRequest(
          action,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request state must be created');
      }
    });

    it('can apply accept with extensionsData and no extensionsData before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionAccept = AcceptAction.format(
        {
          extensionsData: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyActionToRequest(
        actionAccept,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        newExtensionsData,
      );

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

      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
        parameters: { extensionsDataLength: 1 },
      });
    });

    it('can apply accept with extensionsData and extensionsData before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionAccept = AcceptAction.format(
        {
          extensionsData: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyActionToRequest(
        actionAccept,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        TestData.oneExtension.concat(newExtensionsData),
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
        parameters: { extensionsDataLength: 1 },
      });
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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
        parameters: { extensionsDataLength: 1 },
      });
    });
    it('can apply accept without extensionsData and extensionsData before', () => {
      const actionAccept = AcceptAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyActionToRequest(
        actionAccept,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        TestData.oneExtension,
      );

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
  });
});
