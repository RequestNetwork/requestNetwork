import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AcceptAction from '../../../src/actions/accept';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('actions/accept', () => {
  describe('format', () => {
    it('can formatAccept without extensions', () => {
      const txAccept = AcceptAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txAccept, 'txAccept should have a property data').to.have.property('data');
      expect(txAccept.data.action, 'action is wrong').to.equal(Types.REQUEST_LOGIC_ACTION.ACCEPT);
      expect(txAccept.data, 'txAccept.data must have the property parameters').to.have.property(
        'parameters',
      );

      expect(txAccept.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(txAccept.data.parameters.extensions, 'extensions is wrong').to.be.undefined;

      expect(txAccept, 'txAccept.signature is wrong').to.have.property('signature');
      expect(txAccept.signature.method, 'txAccept.signature.method is wrong').to.equal(
        Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txAccept.signature.value, 'txAccept.signature.value').to.equal(
        '0x1e2644fe043c09e48ada29771bbed9d84679c0c0c25019f4ea077441aaf5a2f31a0516ed56b9e4d04fa9ab4f3c8f20c6bbb5cfcb5ce7f2b65191e614e3fc00481b',
      );
    });

    it('can formatAccept with extensions', () => {
      const txAccept = AcceptAction.format(
        {
          extensions: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txAccept, 'txAccept.data is wrong').to.have.property('data');
      expect(txAccept.data.action, 'action is wrong').to.equal(Types.REQUEST_LOGIC_ACTION.ACCEPT);
      expect(txAccept.data, 'txAccept.data must have the property parameters').to.have.property(
        'parameters',
      );

      expect(txAccept.data.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(txAccept.data.parameters.extensions, 'extensions is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(txAccept, 'txAccept.signature is wrong').to.have.property('signature');
      expect(txAccept.signature.method, 'txAccept.signature.method is wrong').to.equal(
        Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txAccept.signature.value, 'txAccept.signature.value').to.equal(
        '0xb9f5c54874771f552b40ada926ad5ccc2d1c8cd960a71e694f2c115e03bda6eb7a728250c6659a5c42f2d51a07a467ff26dddb99f4dd2c2af56a41a5a2ad56811c',
      );
    });
  });

  describe('applyTransactionToRequest', () => {
    it('can apply accept by payer', () => {
      const txAccept = AcceptAction.format(
        { requestId: TestData.requestIdMock },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyTransactionToRequest(
        txAccept,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
        parameters: { extensionsLength: 0 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });

    it('cannot apply accept by payee', () => {
      try {
        const txAccept = AcceptAction.format(
          { requestId: TestData.requestIdMock },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        const request = AcceptAction.applyTransactionToRequest(
          txAccept,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('Signer must be the payer');
      }
    });

    it('cannot apply accept by thirdparty', () => {
      try {
        const txAccept = AcceptAction.format(
          { requestId: TestData.requestIdMock },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );

        const request = AcceptAction.applyTransactionToRequest(
          txAccept,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('Signer must be the payer');
      }
    });

    it('cannot apply accept if no requestId', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {},
            version: CURRENT_VERSION,
          },
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = AcceptAction.applyTransactionToRequest(
          tx,
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
          type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [
          {
            name: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsLength: 0,
              isSignedRequest: false,
            },
            transactionSigner: {
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
        ],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = AcceptAction.applyTransactionToRequest(tx, requestContextNoPayer);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must have a payer');
      }
    });
    it('cannot apply accept if state === CANCELLED in state', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = AcceptAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request state must be created');
      }
    });

    it('cannot apply accept if state === ACCEPTED in state', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = AcceptAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request state must be created');
      }
    });

    it('can apply accept with extensions and no extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txAccept = AcceptAction.format(
        {
          extensions: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyTransactionToRequest(
        txAccept,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(newExtensionsData);

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

      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
        parameters: { extensionsLength: 1 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });

    it('can apply accept with extensions and extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txAccept = AcceptAction.format(
        {
          extensions: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyTransactionToRequest(
        txAccept,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
        TestData.oneExtension.concat(newExtensionsData),
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
        parameters: { extensionsLength: 1 },
        transactionSigner: TestData.payerRaw.identity,
      });
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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
        parameters: { extensionsLength: 1 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });
    it('can apply accept without extensions and extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txAccept = AcceptAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = AcceptAction.applyTransactionToRequest(
        txAccept,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
        TestData.oneExtension,
      );

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
  });
});
