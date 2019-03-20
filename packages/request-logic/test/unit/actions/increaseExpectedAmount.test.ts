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
    it('can increase expected amount without extensionsData', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(actionIncreaseAmount.data.name, 'action is wrong').to.equal(
        Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
      );

      expect(actionIncreaseAmount.data.parameters.requestId, 'requestId is wrong').to.equal(
        requestIdMock,
      );
      expect(actionIncreaseAmount.data.parameters.deltaAmount, 'deltaAmount is wrong').to.equal(
        arbitraryDeltaAmount,
      );
      expect(actionIncreaseAmount.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
    });

    it('can increase expected amount with extensionsData', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: TestData.oneExtension,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(actionIncreaseAmount.data.name, 'action is wrong').to.equal(
        Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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
    });

    it('cannot increase expected amount with not a number', () => {
      expect(() =>
        IncreaseExpectedAmountAction.format(
          {
            deltaAmount: 'this is not a number',
            requestId: requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).to.throw('deltaAmount must be a string representing a positive integer');
    });

    it('cannot increase expected amount with decimal', () => {
      expect(() =>
        IncreaseExpectedAmountAction.format(
          {
            deltaAmount: '0.12345',
            requestId: requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).to.throw('deltaAmount must be a string representing a positive integer');
    });

    it('cannot increase expected amount with a negative number', async () => {
      expect(() =>
        IncreaseExpectedAmountAction.format(
          {
            deltaAmount: '-1234',
            requestId: requestIdMock,
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).to.throw('deltaAmount must be a string representing a positive integer');
    });
  });

  describe('applyActionToRequest', () => {
    it('can increase expected amount by payer', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
        2,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'extensions is wrong').to.be.deep.equal({});

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
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
        name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });

    it('cannot increase expected amount by payee', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        IncreaseExpectedAmountAction.applyActionToRequest(
          actionIncreaseAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('signer must be the payer');
    });

    it('cannot increase expected amount by third party', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.otherIdRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() =>
        IncreaseExpectedAmountAction.applyActionToRequest(
          actionIncreaseAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('signer must be the payer');
    });

    it('cannot increase expected amount if no requestId', () => {
      const action = {
        data: {
          name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmount,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('requestId must be given');
    });

    it('cannot increase expected amount if no deltaAmount', () => {
      const action = {
        data: {
          name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            requestId: requestIdMock,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('deltaAmount must be given');
    });

    it('cannot increase expected amount if no payer in state', () => {
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
        expectedAmount: arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: requestIdMock,
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const action = {
        data: {
          name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
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
        IncreaseExpectedAmountAction.applyActionToRequest(action, 2, requestContextNoPayer),
      ).to.throw('the request must have a payer');
    });

    it('cannot increase expected amount if state === CANCELED in state', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() =>
        IncreaseExpectedAmountAction.applyActionToRequest(
          actionIncreaseAmount,
          2,
          Utils.deepCopy(TestData.requestCanceledNoExtension),
        ),
      ).to.throw('the request must not be canceled');
    });

    it('can increase expected amount if state === ACCEPTED in state', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
        2,
        Utils.deepCopy(TestData.requestAcceptedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.ACCEPTED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensions, 'extensions is wrong').to.be.deep.equal({});

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.events[2], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });

    it('can increase expected amount with extensionsData and no extensionsData before', async () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: newExtensionsData,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
        2,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        newExtensionsData,
      );

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
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
        name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });

    it('can increase expected amount with extensionsData and extensionsData before', async () => {
      const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: newExtensionsData,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
        2,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        TestData.oneExtension.concat(newExtensionsData),
      );

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
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
        name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });
    it('can increase expected amount without extensionsData and extensionsData before', async () => {
      const actionIncreaseAmount = await IncreaseExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = IncreaseExpectedAmountAction.applyActionToRequest(
        actionIncreaseAmount,
        2,
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );

      expect(request.requestId, 'requestId is wrong').to.equal(requestIdMock);
      expect(request.currency, 'currency is wrong').to.equal(Types.CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        arbitraryExpectedAmountAfterDelta,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        TestData.oneExtension,
      );

      expect(request, 'request.creator is wrong').to.have.property('creator');
      expect(request.creator.type, 'request.creator.type is wrong').to.equal(
        IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      );
      expect(request.creator.value, 'request.creator.value is wrong').to.equal(
        TestData.payeeRaw.address,
      );

      expect(request, 'request.payee is wrong').to.have.property('payee');
      if (request.payee) {
        expect(request.payee.type, 'request.payee.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payee.value, 'request.payee.value is wrong').to.equal(
          TestData.payeeRaw.address,
        );
      }
      expect(request, 'request.payer is wrong').to.have.property('payer');
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
        name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });

    it('cannot increase expected amount with a negative amount', () => {
      const action = {
        data: {
          name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: arbitraryDeltaAmountNegative,
            requestId: requestIdMock,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('deltaAmount must be a string representing a positive integer');
    });

    it('cannot increase expected amount with not a number', () => {
      const action = {
        data: {
          name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: 'Not a number',
            requestId: requestIdMock,
            version: CURRENT_VERSION,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('deltaAmount must be a string representing a positive integer');
    });

    it('cannot increase expected amount with decimal', () => {
      const action = {
        data: {
          name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '0.0234',
            requestId: requestIdMock,
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
        IncreaseExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        ),
      ).to.throw('deltaAmount must be a string representing a positive integer');
    });
  });
});
