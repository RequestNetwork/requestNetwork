import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import ReduceExpectedAmountAction from '../../../src/actions/reduceExpectedAmount';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

const requestIdMock = '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8';

const arbitraryExpectedAmount = '123400000000000000';
const biggerThanArbitraryExpectedAmount = '223400000000000000';
const arbitraryDeltaAmount = '100000000000000000';
const arbitraryDeltaAmountNegative = '-100000000000000000';
const arbitraryExpectedAmountAfterDelta = '23400000000000000';

/* tslint:disable:no-unused-expression */
describe('actions/reduceExpectedAmount', () => {
  describe('format', () => {
    it('can reduce expected amount without extensions', () => {
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txReduceAmount, 'txReduceAmount.data should be a property').to.have.property('data');
      expect(txReduceAmount.data.action, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
      );
      expect(txReduceAmount.data, 'txReduceAmount.data.parameters is wrong').to.have.property(
        'parameters',
      );

      expect(txReduceAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(txReduceAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(txReduceAmount.data.parameters.extensions, 'extensions is wrong').to.be.undefined;

      expect(txReduceAmount, 'txReduceAmount.signature should be a property').to.have.property(
        'signature',
      );
      expect(txReduceAmount.signature.method, 'txReduceAmount.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(txReduceAmount.signature.value, 'txReduceAmount.signature.value').to.equal(
        '0xe96bb22fe38dde63e04fbce8d06ac2d9fc319e9a6b361586b5337543cdc942a224087fe11a2f9d589ad2a73cd3f58d83e3a8aaf588b82e93a2ae99c551da86551c',
      );
    });

    it('can reduce expected amount with extensions', () => {
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensions: TestData.oneExtension,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txReduceAmount, 'txReduceAmount.data should be a property').to.have.property('data');
      expect(txReduceAmount.data.action, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
      );
      expect(txReduceAmount.data, 'txReduceAmount.data.parameters is wrong').to.have.property(
        'parameters',
      );

      expect(txReduceAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(txReduceAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(txReduceAmount.data.parameters.extensions, 'extensions is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(txReduceAmount, 'txReduceAmount.signature should be a property').to.have.property(
        'signature',
      );
      expect(txReduceAmount.signature.method, 'txReduceAmount.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(txReduceAmount.signature.value, 'txReduceAmount.signature.value').to.equal(
        '0xa8ceca6ea19a077d7f8191fda58611d63e304a5d910904cb10966800d0f9f402524f93c2af855b7ac126b1b1dce274a1acce8f36c9bcd107825dd02d7241e30e1c',
      );
    });

    it('cannot reduce expected amount with not a number', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: 'this not a number',
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'deltaAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot reduce expected amount with decimal', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: '0.1234',
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'deltaAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot reduce expected amount with negative', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: '-1234',
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'deltaAmount must be a string representing a positive integer',
        );
      }
    });
  });

  describe('applyTransactionToRequest', () => {
    it('can reduce expected amount by payee', () => {
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyTransactionToRequest(
        txReduceAmount,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsLength: 0, deltaAmount: arbitraryDeltaAmount },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('cannot reduce expected amount by payer', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          txReduceAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('signer must be the payee');
      }
    });

    it('cannot reduce expected amount by thirdparty', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          txReduceAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('signer must be the payee');
      }
    });

    it('cannot reduce expected amount if no requestId', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: arbitraryDeltaAmount,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('requestId must be given');
      }
    });

    it('cannot reduce expected amount if no deltaAmount', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              requestId: requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('deltaAmount must be given');
      }
    });

    it('cannot reduce expected amount if no payee in state', () => {
      const requestContextNoPayer = {
        creator: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
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
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
        ],
        expectedAmount: arbitraryExpectedAmount,
        payer: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: arbitraryDeltaAmount,
              requestId: requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };
        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          tx,
          requestContextNoPayer,
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must have a payee');
      }
    });

    it('cannot reduce expected amount if state === CANCELLED in state', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          txReduceAmount,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must not be cancelled');
      }
    });

    it('can reduce expected amount if state === ACCEPTED in state', () => {
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyTransactionToRequest(
        txReduceAmount,
        Utils.deepCopy(TestData.requestAcceptedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

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
      expect(request.events[2], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsLength: 0, deltaAmount: arbitraryDeltaAmount },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('can reduce expected amount with extensions and no extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensions: newExtensionsData,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyTransactionToRequest(
        txReduceAmount,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(newExtensionsData);

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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsLength: 1, deltaAmount: arbitraryDeltaAmount },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('can reduce expected amount with extensions and extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensions: newExtensionsData,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyTransactionToRequest(
        txReduceAmount,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
        TestData.oneExtension.concat(newExtensionsData),
      );

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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsLength: 1, deltaAmount: arbitraryDeltaAmount },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });
    it('can reduce expected amount without extensions and extensions before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyTransactionToRequest(
        txReduceAmount,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(
        TestData.oneExtension,
      );

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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsLength: 0, deltaAmount: arbitraryDeltaAmount },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('cannot reduce expected amount with a negative amount', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: arbitraryDeltaAmountNegative,
              requestId: requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'deltaAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot reduce expected amount with not a number', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: 'Not a number',
              requestId: requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'deltaAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot reduce expected amount with decimal', () => {
      try {
        const tx = {
          data: {
            action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '0.0234',
              requestId: requestIdMock,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          tx,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'deltaAmount must be a string representing a positive integer',
        );
      }
    });

    it('can reduce expected amount to zero', () => {
      const txReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryExpectedAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyTransactionToRequest(
        txReduceAmount,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal('0');
      expect(request.extensions, 'extensions is wrong').to.be.undefined;

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
      expect(request.events[1], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsLength: 0, deltaAmount: TestData.arbitraryExpectedAmount },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('cannot reduce expected amount below zero', () => {
      try {
        const txReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: biggerThanArbitraryExpectedAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        const request = ReduceExpectedAmountAction.applyTransactionToRequest(
          txReduceAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('result of reduce is not valid');
      }
    });
  });
});
