import { expect } from 'chai';
import 'mocha';

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
    it('can reduce expected amount without extensionsData', () => {
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(actionReduceAmount.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
      );

      expect(actionReduceAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(actionReduceAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(actionReduceAmount.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;

      expect(
        actionReduceAmount,
        'actionReduceAmount.signature should be a property',
      ).to.have.property('signature');
      expect(
        actionReduceAmount.signature.method,
        'actionReduceAmount.signature.method is wrong',
      ).to.equal(SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA);
      expect(actionReduceAmount.signature.value, 'actionReduceAmount.signature.value').to.equal(
        '0x10c2dfb20b4639b0d4bd3ae735b216cb646c624e0495b207b95662d4584c066c4d922e7f47f28b59b89ccff877e1b133f66158a9c0a7957c354d6679e8f552c11c',
      );
    });

    it('can reduce expected amount with extensionsData', () => {
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: TestData.oneExtension,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(actionReduceAmount.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
      );

      expect(actionReduceAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(actionReduceAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(
        actionReduceAmount.data.parameters.extensionsData,
        'extensionsData is wrong',
      ).to.deep.equal(TestData.oneExtension);

      expect(
        actionReduceAmount,
        'actionReduceAmount.signature should be a property',
      ).to.have.property('signature');
      expect(
        actionReduceAmount.signature.method,
        'actionReduceAmount.signature.method is wrong',
      ).to.equal(SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA);
      expect(actionReduceAmount.signature.value, 'actionReduceAmount.signature.value').to.equal(
        '0x1185d23aca21dae8a369b58fcd5df401b58c1ef37a243d0a30811f3742af5a9b78e5c0c5454d1edb95df9e2a2d317ca95a8abe9b9158dfbe2a73d37db35e12c31b',
      );
    });

    it('cannot reduce expected amount with not a number', () => {
      try {
        ReduceExpectedAmountAction.format(
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
        ReduceExpectedAmountAction.format(
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
        ReduceExpectedAmountAction.format(
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

  describe('applyActionToRequest', () => {
    it('can reduce expected amount by payee', () => {
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

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
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('cannot reduce expected amount by payer', () => {
      try {
        const actionReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );

        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('signer must be the payee');
      }
    });

    it('cannot reduce expected amount by thirdparty', () => {
      try {
        const actionReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );

        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('signer must be the payee');
      }
    });

    it('cannot reduce expected amount if no requestId', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('requestId must be given');
      }
    });

    it('cannot reduce expected amount if no deltaAmount', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
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
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
        ReduceExpectedAmountAction.applyActionToRequest(action, requestContextNoPayer);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must have a payee');
      }
    });

    it('cannot reduce expected amount if state === CANCELLED in state', () => {
      try {
        const actionReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must not be cancelled');
      }
    });

    it('can reduce expected amount if state === ACCEPTED in state', () => {
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        Utils.deepCopy(TestData.requestAcceptedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

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
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('can reduce expected amount with extensionsData and no extensionsData before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: newExtensionsData,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        newExtensionsData,
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
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('can reduce expected amount with extensionsData and extensionsData before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: newExtensionsData,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
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
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
      });
    });
    it('can reduce expected amount without extensionsData and extensionsData before', () => {
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
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
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('cannot reduce expected amount with a negative amount', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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

        ReduceExpectedAmountAction.applyActionToRequest(
          action,
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
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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

        ReduceExpectedAmountAction.applyActionToRequest(
          action,
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
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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

        ReduceExpectedAmountAction.applyActionToRequest(
          action,
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
      const actionReduceAmount = ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryExpectedAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal('0');
      expect(request.extensionsData, 'extensionsData is wrong').to.be.undefined;

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
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: TestData.arbitraryExpectedAmount },
      });
    });

    it('cannot reduce expected amount below zero', () => {
      try {
        const actionReduceAmount = ReduceExpectedAmountAction.format(
          {
            deltaAmount: biggerThanArbitraryExpectedAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('result of reduce is not valid');
      }
    });
  });
});
