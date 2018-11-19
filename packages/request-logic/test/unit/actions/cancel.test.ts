import { expect } from 'chai';
import 'mocha';

import Utils from '@requestnetwork/utils';
import CancelAction from '../../../src/actions/cancel';
import * as RequestEnum from '../../../src/enum';
import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('actions/cancel', () => {
  describe('format', () => {
    it('can cancel without extensions', () => {
      const txCancel = CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txCancel, 'txCancel.transaction is wrong').to.have.property('transaction');
      expect(txCancel.transaction.action, 'action is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
      );
      expect(
        txCancel.transaction,
        'txCancel.transaction must have the property parameters',
      ).to.have.property('parameters');

      expect(txCancel.transaction.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(txCancel.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;

      expect(txCancel, 'txCancel.signature is wrong').to.have.property('signature');
      expect(txCancel.signature.method, 'txCancel.signature.method is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txCancel.signature.value, 'txCancel.signature.value').to.equal(
        '0xa302a86be6f508921f8551326baa02c42c525336bd8bdd1ea8a4484d4edd605644d058691d6d9ce13bfaa557714eed209766dffc070ea3e1f70f77350513d4951c',
      );
    });

    it('can cancel with extensions', () => {
      const txCancel = CancelAction.format(
        {
          extensions: TestData.oneExtension,
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txCancel, 'txCancel.transaction is wrong').to.have.property('transaction');
      expect(txCancel.transaction.action, 'action is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
      );
      expect(
        txCancel.transaction,
        'txCancel.transaction must have the property parameters',
      ).to.have.property('parameters');

      expect(txCancel.transaction.parameters.requestId, 'requestId is wrong').to.equal(
        TestData.requestIdMock,
      );
      expect(txCancel.transaction.parameters.extensions, 'extensions is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(txCancel, 'txCancel.signature is wrong').to.have.property('signature');
      expect(txCancel.signature.method, 'txCancel.signature.method is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txCancel.signature.value, 'txCancel.signature.value').to.equal(
        '0x8fe423967d69b99574688334975dbd588b2df5e416f3ea661e921392ea9a906a173a16cb58c25a569b7febb86032d9f66e0d4626eabb4f3dc54670b55a3cfb5e1c',
      );
    });
  });

  describe('applyTransactionToRequest', () => {
    it('can cancel by payer with state === created', () => {
      const txCancel = CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );
      const request = CancelAction.applyTransactionToRequest(
        txCancel,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }

      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
        parameters: { extensionsLength: 0 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });
    it('cannot cancel by payer with state === accepted', () => {
      try {
        const txCancel = CancelAction.format(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );

        const request = CancelAction.applyTransactionToRequest(
          txCancel,
          Utils.deepCopy(TestData.requestAcceptedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'A payer cancel need to be done on a request with the state created',
        );
      }
    });
    it('cannot cancel by payer with state === cancelled', () => {
      try {
        const txCancel = CancelAction.format(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );

        const request = CancelAction.applyTransactionToRequest(
          txCancel,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'A payer cancel need to be done on a request with the state created',
        );
      }
    });

    it('can cancel by payee with state === created', () => {
      const txCancel = CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      const request = CancelAction.applyTransactionToRequest(
        txCancel,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
        parameters: { extensionsLength: 0 },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });
    it('can cancel by payee with state === accepted', () => {
      const txCancel = CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = CancelAction.applyTransactionToRequest(
        txCancel,
        Utils.deepCopy(TestData.requestAcceptedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[2], 'request.events is wrong').to.deep.equal({
        name: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
        parameters: { extensionsLength: 0 },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });
    it('cannot cancel by payee with state === cancelled', () => {
      try {
        const txCancel = CancelAction.format(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        const request = CancelAction.applyTransactionToRequest(
          txCancel,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Cannot cancel an already cancelled request',
        );
      }
    });

    it('cannot cancel by thirdparty', () => {
      try {
        const txCancel = CancelAction.format(
          {
            requestId: TestData.requestIdMock,
          },
          {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );

        const request = CancelAction.applyTransactionToRequest(
          txCancel,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payer or the payee',
        );
      }
    });

    it('cannot cancel if no requestId', () => {
      try {
        const signedTx = {
          signature: {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
            parameters: {},
            version: CURRENT_VERSION,
          },
        };
        const request = CancelAction.applyTransactionToRequest(
          signedTx,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('requestId must be given');
      }
    });
    it('cannot cancel by payer if no payer in state', () => {
      const requestContextNoPayer = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        events: [
          {
            name: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsLength: 0,
              isSignedRequest: false,
            },
            transactionSigner: {
              type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
        ],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const signedTx = {
          signature: {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
        };
        const request = CancelAction.applyTransactionToRequest(signedTx, requestContextNoPayer);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payer or the payee',
        );
      }
    });
    it('cannot cancel by payee if no payee in state', () => {
      const requestContextNoPayee = {
        creator: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        events: [
          {
            name: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsLength: 0,
              isSignedRequest: false,
            },
            transactionSigner: {
              type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
        ],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payer: {
          type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const signedTx = {
          signature: {
            method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
            parameters: {
              requestId: TestData.requestIdMock,
            },
            version: CURRENT_VERSION,
          },
        };
        const request = CancelAction.applyTransactionToRequest(signedTx, requestContextNoPayee);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payer or the payee',
        );
      }
    });
    it('can cancel with extensions and no extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txCancel = CancelAction.format(
        {
          extensions: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = CancelAction.applyTransactionToRequest(
        txCancel,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(newExtensionsData);

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
        parameters: { extensionsLength: 1 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });

    it('can cancel with extensions and extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txCancel = CancelAction.format(
        {
          extensions: newExtensionsData,
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = CancelAction.applyTransactionToRequest(
        txCancel,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
        TestData.oneExtension.concat(newExtensionsData),
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
        parameters: { extensionsLength: 1 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });
    it('can cancel without extensions and extensions before', () => {
      const txCancel = CancelAction.format(
        {
          requestId: TestData.requestIdMock,
        },
        {
          method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = CancelAction.applyTransactionToRequest(
        txCancel,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(TestData.requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(request.state, 'state is wrong').to.equal(RequestEnum.REQUEST_LOGIC_STATE.CANCELLED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(request, 'request should have property creator').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request should have property payee').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
        parameters: { extensionsLength: 0 },
        transactionSigner: TestData.payerRaw.identity,
      });
    });
  });
});
