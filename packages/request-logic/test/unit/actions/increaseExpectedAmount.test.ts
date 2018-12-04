import { expect } from 'chai';
import 'mocha';

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import IncreaseExpectedAmountAction from '../../../src/actions/increaseExpectedAmount';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

const requestIdMock = '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8';

const arbitraryExpectedAmount = '123400000000000000';
const arbitraryDeltaAmount = '100000000000000000';
const arbitraryDeltaAmountNegative = '-100000000000000000';
const arbitraryExpectedAmountAfterDelta = '223400000000000000';

/* tslint:disable:no-unused-expression */
describe('actions/increaseExpectedAmount', () => {
  describe('format', () => {
    it('can increase expected amount without extensionsData', () => {
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(actionIncreaseAmount.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
      );

      expect(actionIncreaseAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(actionIncreaseAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(actionIncreaseAmount.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;

      expect(
        actionIncreaseAmount,
        'actionIncreaseAmount.signature must be a property',
      ).to.have.property('signature');
      expect(
        actionIncreaseAmount.signature.method,
        'actionIncreaseAmount.signature.method is wrong',
      ).to.equal(SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA);
      expect(actionIncreaseAmount.signature.value, 'actionIncreaseAmount.signature.value').to.equal(
        '0x7a07be92cbdcceb63ff9270ca3bd04e0834013618746e28e326fb87c8e30ef9e41dbfcc454e2536eabda5888c4e6712bf6630428b87467ef4b859e3e9849198b1b',
      );
    });

    it('can increase expected amount with extensionsData', () => {
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
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

      expect(actionIncreaseAmount.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
      );

      expect(actionIncreaseAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(actionIncreaseAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(
        actionIncreaseAmount.data.parameters.extensionsData,
        'extensionsData is wrong',
      ).to.deep.equal(TestData.oneExtension);

      expect(
        actionIncreaseAmount,
        'actionIncreaseAmount.signature must be a property',
      ).to.have.property('signature');
      expect(
        actionIncreaseAmount.signature.method,
        'actionIncreaseAmount.signature.method is wrong',
      ).to.equal(SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA);
      expect(actionIncreaseAmount.signature.value, 'actionIncreaseAmount.signature.value').to.equal(
        '0xf44877582b520d94b90b8a58f818b593bdefae0066553a24aa17489dcf1145a74edffd516a89676c654fc7288dcb97d2a26121529728b84593d80659bac377fc1b',
      );
    });

    it('cannot increase expected amount with not a number', () => {
      try {
        IncreaseExpectedAmountAction.format(
          {
            deltaAmount: 'this is not a number',
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

    it('cannot increase expected amount with decimal', () => {
      try {
        IncreaseExpectedAmountAction.format(
          {
            deltaAmount: '0.12345',
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

    it('cannot increase expected amount with a negative number', () => {
      try {
        IncreaseExpectedAmountAction.format(
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
    it('can increase expected amount by payer', () => {
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
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
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('cannot increase expected amount by payee', () => {
      try {
        const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );

        IncreaseExpectedAmountAction.applyActionToRequest(
          actionIncreaseAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('signer must be the payer');
      }
    });

    it('cannot increase expected amount by thirdparty', () => {
      try {
        const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );

        IncreaseExpectedAmountAction.applyActionToRequest(
          actionIncreaseAmount,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('signer must be the payer');
      }
    });

    it('cannot increase expected amount if no requestId', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('requestId must be given');
      }
    });

    it('cannot increase expected amount if no deltaAmount', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('deltaAmount must be given');
      }
    });

    it('cannot increase expected amount if no payer in state', () => {
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
        payee: {
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
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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
        IncreaseExpectedAmountAction.applyActionToRequest(action, requestContextNoPayer);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must have a payer');
      }
    });

    it('cannot increase expected amount if state === CANCELLED in state', () => {
      try {
        const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );

        IncreaseExpectedAmountAction.applyActionToRequest(
          actionIncreaseAmount,
          Utils.deepCopy(TestData.requestCancelledNoExtension),
        );

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('the request must not be cancelled');
      }
    });

    it('can increase expected amount if state === ACCEPTED in state', () => {
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
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
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('can increase expected amount with extensionsData and no extensionsData before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: newExtensionsData,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
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
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('can increase expected amount with extensionsData and extensionsData before', () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: newExtensionsData,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
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
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
      });
    });
    it('can increase expected amount without extensionsData and extensionsData before', () => {
      const actionIncreaseAmount = IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
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
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
      });
    });

    it('cannot increase expected amount with a negative amount', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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

        IncreaseExpectedAmountAction.applyActionToRequest(
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

    it('cannot increase expected amount with not a number', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: 'Not a number',
              requestId: requestIdMock,
              version: CURRENT_VERSION,
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        IncreaseExpectedAmountAction.applyActionToRequest(
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

    it('cannot increase expected amount with decimal', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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

        IncreaseExpectedAmountAction.applyActionToRequest(
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
  });
});
