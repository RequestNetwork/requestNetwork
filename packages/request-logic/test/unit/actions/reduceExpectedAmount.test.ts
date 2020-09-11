import { IdentityTypes, RequestLogicTypes, SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import ReduceExpectedAmountAction from '../../../src/actions/reduceExpectedAmount';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

const requestIdMock = '011c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8';

const arbitraryExpectedAmount = '123400000000000000';
const biggerThanArbitraryExpectedAmount = '223400000000000000';
const arbitraryDeltaAmount = '100000000000000000';
const arbitraryDeltaAmountNegative = '-100000000000000000';
const arbitraryExpectedAmountAfterDelta = '23400000000000000';

/* tslint:disable:no-unused-expression */
describe('actions/reduceExpectedAmount', () => {
  describe('format', () => {
    it('can reduce expected amount without extensionsData', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionReduceAmount.data.name).toBe(RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT);

      // 'requestId is wrong'
      expect(actionReduceAmount.data.parameters.requestId).toBe(requestIdMock);
      // 'deltaAmount is wrong'
      expect(actionReduceAmount.data.parameters.deltaAmount).toBe(arbitraryDeltaAmount);
      // 'extensionsData is wrong'
      expect(actionReduceAmount.data.parameters.extensionsData).toBeUndefined();
    });

    it('can reduce expected amount with extensionsData', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          extensionsData: TestData.oneExtension,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionReduceAmount.data.name).toBe(RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT);

      // 'requestId is wrong'
      expect(actionReduceAmount.data.parameters.requestId).toBe(requestIdMock);
      // 'deltaAmount is wrong'
      expect(actionReduceAmount.data.parameters.deltaAmount).toBe(arbitraryDeltaAmount);
      // 'extensionsData is wrong'
      expect(actionReduceAmount.data.parameters.extensionsData).toEqual(TestData.oneExtension);
    });

    it('cannot reduce expected amount with not a number', () => {
      expect(() => {
        ReduceExpectedAmountAction.format(
          {
            deltaAmount: 'this not a number',
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );
      }).toThrowError('deltaAmount must be a string representing a positive integer');
    });

    it('cannot reduce expected amount with decimal', () => {
      expect(() => {
        ReduceExpectedAmountAction.format(
          {
            deltaAmount: '0.1234',
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );
      }).toThrowError('deltaAmount must be a string representing a positive integer');
    });

    it('cannot reduce expected amount with negative', () => {
      expect(() => {
        ReduceExpectedAmountAction.format(
          {
            deltaAmount: '-1234',
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );
      }).toThrowError('deltaAmount must be a string representing a positive integer');
    });
  });

  describe('applyActionToRequest', () => {
    it('can reduce expected amount by payee', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        2,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request.creator is wrong'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request.payee is wrong'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request.payer is wrong'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
      // 'request.events is wrong'
      expect(request.events[1]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });

    it('cannot reduce expected amount by payer', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('signer must be the payee');
    });

    it('cannot reduce expected amount by third party', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.otherIdRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('signer must be the payee');
    });

    it('cannot reduce expected amount if no requestId', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('requestId must be given');
    });

    it('cannot reduce expected amount if no deltaAmount', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('deltaAmount must be given');
    });

    it('cannot reduce expected amount if no payee in state', () => {
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
        expectedAmount: arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        requestId: requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(action, 2, requestContextNoPayer);
      }).toThrowError('the request must have a payee');
    });

    it(
      'cannot reduce expected amount if state === CANCELED in state',
      async () => {
        const actionReduceAmount = await ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );

        expect(() => {
          ReduceExpectedAmountAction.applyActionToRequest(
            actionReduceAmount,
            2,
            Utils.deepCopy(TestData.requestCanceledNoExtension),
          );
        }).toThrowError('the request must not be canceled');
      }
    );

    it('can reduce expected amount if state === ACCEPTED in state', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryDeltaAmount,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        2,
        Utils.deepCopy(TestData.requestAcceptedNoExtension),
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request.creator is wrong'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request.payee is wrong'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request.payer is wrong'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
      // 'request.events is wrong'
      expect(request.events[2]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
        timestamp: 2,
      });
    });

    it(
      'can reduce expected amount with extensionsData and no extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionReduceAmount = await ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            extensionsData: newExtensionsData,
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );

        // 'requestId is wrong'
        expect(request.requestId).toBe(requestIdMock);
        // 'currency is wrong'
        expect(request.currency).toEqual({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        // 'state is wrong'
        expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
        // 'expectedAmount is wrong'
        expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
        // 'request.extensionsData is wrong'
        expect(request.extensionsData).toEqual(newExtensionsData);

        // 'request.creator is wrong'
        expect(request).toHaveProperty('creator');
        // 'request.creator.type is wrong'
        expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.creator.value is wrong'
        expect(request.creator.value).toBe(TestData.payeeRaw.address);

        // 'request.payee is wrong'
        expect(request).toHaveProperty('payee');
        if (request.payee) {
          // 'request.payee.type is wrong'
          expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
          // 'request.payee.value is wrong'
          expect(request.payee.value).toBe(TestData.payeeRaw.address);
        }
        // 'request.payer is wrong'
        expect(request).toHaveProperty('payer');
        if (request.payer) {
          // 'request.payer.type is wrong'
          expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
          // 'request.payer.value is wrong'
          expect(request.payer.value).toBe(TestData.payerRaw.address);
        }
        // 'request.events is wrong'
        expect(request.events[1]).toEqual({
          actionSigner: TestData.payeeRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
          timestamp: 2,
        });
      }
    );

    it(
      'can reduce expected amount with extensionsData and extensionsData before',
      async () => {
        const newExtensionsData = [{ id: 'extension1', value: 'whatever' }];
        const actionReduceAmount = await ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            extensionsData: newExtensionsData,
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedWithExtensions),
        );

        // 'requestId is wrong'
        expect(request.requestId).toBe(requestIdMock);
        // 'currency is wrong'
        expect(request.currency).toEqual({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        // 'state is wrong'
        expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
        // 'expectedAmount is wrong'
        expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
        // 'request.extensionsData is wrong'
        expect(request.extensionsData).toEqual(TestData.oneExtension.concat(newExtensionsData));

        // 'request.creator is wrong'
        expect(request).toHaveProperty('creator');
        // 'request.creator.type is wrong'
        expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.creator.value is wrong'
        expect(request.creator.value).toBe(TestData.payeeRaw.address);

        // 'request.payee is wrong'
        expect(request).toHaveProperty('payee');
        if (request.payee) {
          // 'request.payee.type is wrong'
          expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
          // 'request.payee.value is wrong'
          expect(request.payee.value).toBe(TestData.payeeRaw.address);
        }
        // 'request.payer is wrong'
        expect(request).toHaveProperty('payer');
        if (request.payer) {
          // 'request.payer.type is wrong'
          expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
          // 'request.payer.value is wrong'
          expect(request.payer.value).toBe(TestData.payerRaw.address);
        }
        // 'request.events is wrong'
        expect(request.events[1]).toEqual({
          actionSigner: TestData.payeeRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: { extensionsDataLength: 1, deltaAmount: arbitraryDeltaAmount },
          timestamp: 2,
        });
      }
    );
    it(
      'can reduce expected amount without extensionsData and extensionsData before',
      async () => {
        const actionReduceAmount = await ReduceExpectedAmountAction.format(
          {
            deltaAmount: arbitraryDeltaAmount,
            requestId: requestIdMock,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );

        const request = ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedWithExtensions),
        );

        // 'requestId is wrong'
        expect(request.requestId).toBe(requestIdMock);
        // 'currency is wrong'
        expect(request.currency).toEqual({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        // 'state is wrong'
        expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
        // 'expectedAmount is wrong'
        expect(request.expectedAmount).toBe(arbitraryExpectedAmountAfterDelta);
        // 'request.extensionsData is wrong'
        expect(request.extensionsData).toEqual(TestData.oneExtension);

        // 'request.creator is wrong'
        expect(request).toHaveProperty('creator');
        // 'request.creator.type is wrong'
        expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.creator.value is wrong'
        expect(request.creator.value).toBe(TestData.payeeRaw.address);

        // 'request.payee is wrong'
        expect(request).toHaveProperty('payee');
        if (request.payee) {
          // 'request.payee.type is wrong'
          expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
          // 'request.payee.value is wrong'
          expect(request.payee.value).toBe(TestData.payeeRaw.address);
        }
        // 'request.payer is wrong'
        expect(request).toHaveProperty('payer');
        if (request.payer) {
          // 'request.payer.type is wrong'
          expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
          // 'request.payer.value is wrong'
          expect(request.payer.value).toBe(TestData.payerRaw.address);
        }
        // 'request.events is wrong'
        expect(request.events[1]).toEqual({
          actionSigner: TestData.payeeRaw.identity,
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: { extensionsDataLength: 0, deltaAmount: arbitraryDeltaAmount },
          timestamp: 2,
        });
      }
    );

    it('cannot reduce expected amount with a negative amount', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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

      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('deltaAmount must be a string representing a positive integer');
    });

    it('cannot reduce expected amount with not a number', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: 'Not a number',
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

      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('deltaAmount must be a string representing a positive integer');
    });

    it('cannot reduce expected amount with decimal', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
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
      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          action,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('deltaAmount must be a string representing a positive integer');
    });

    it('can reduce expected amount to zero', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: arbitraryExpectedAmount,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = ReduceExpectedAmountAction.applyActionToRequest(
        actionReduceAmount,
        2,
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );

      // 'requestId is wrong'
      expect(request.requestId).toBe(requestIdMock);
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe('0');
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request.creator is wrong'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request.payee is wrong'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request.payer is wrong'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
      // 'request.events is wrong'
      expect(request.events[1]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: { extensionsDataLength: 0, deltaAmount: TestData.arbitraryExpectedAmount },
        timestamp: 2,
      });
    });

    it('cannot reduce expected amount below zero', async () => {
      const actionReduceAmount = await ReduceExpectedAmountAction.format(
        {
          deltaAmount: biggerThanArbitraryExpectedAmount,
          requestId: requestIdMock,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(() => {
        ReduceExpectedAmountAction.applyActionToRequest(
          actionReduceAmount,
          2,
          Utils.deepCopy(TestData.requestCreatedNoExtension),
        );
      }).toThrowError('result of reduce is not valid');
    });
  });
});
