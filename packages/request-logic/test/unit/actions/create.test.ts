import MultiFormat from '@requestnetwork/multi-format';
import { IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import CreateAction from '../../../src/actions/create';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('CreateAction', () => {
  describe('format', () => {
    it('can create with only the payee', async () => {
      const actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          timestamp: TestData.arbitraryTimestamp,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'action is wrong'
      expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
      // 'actionCreation.data.version is wrong'
      expect(actionCreation.data.version).toBe(CURRENT_VERSION);

      // 'currency is wrong'
      expect(actionCreation.data.parameters.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'timestamp is wrong'
      expect(actionCreation.data.parameters.timestamp).toBe(TestData.arbitraryTimestamp);
      // 'nonce is wrong'
      expect(actionCreation.data.parameters.nonce).toBeUndefined();
      // 'extensionsData is wrong'
      expect(actionCreation.data.parameters.extensionsData).toBeUndefined();
      // 'payer is wrong'
      expect(actionCreation.data.parameters.payer).toBeUndefined();

      // 'actionCreation.data.parameters.payee is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payee');
      // 'actionCreation.data.parameters.payee.type is wrong'
      expect(actionCreation.data.parameters.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payee.value is wrong'
      expect(actionCreation.data.parameters.payee.value).toBe(TestData.payeeRaw.address);
    });

    it('can create with nonce', async () => {
      const actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          nonce: 2,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          timestamp: TestData.arbitraryTimestamp,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'action is wrong'
      expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
      // 'actionCreation.data.version is wrong'
      expect(actionCreation.data.version).toBe(CURRENT_VERSION);

      // 'currency is wrong'
      expect(actionCreation.data.parameters.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'timestamp is wrong'
      expect(actionCreation.data.parameters.timestamp).toBe(TestData.arbitraryTimestamp);
      // 'nonce is wrong'
      expect(actionCreation.data.parameters.nonce).toBe(2);
      // 'extensionsData is wrong'
      expect(actionCreation.data.parameters.extensionsData).toBeUndefined();
      // 'payer is wrong'
      expect(actionCreation.data.parameters.payer).toBeUndefined();

      // 'actionCreation.data.parameters.payee is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payee');
      // 'actionCreation.data.parameters.payee.type is wrong'
      expect(actionCreation.data.parameters.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payee.value is wrong'
      expect(actionCreation.data.parameters.payee.value).toBe(TestData.payeeRaw.address);
    });

    it('can generate timestamp if not given', async () => {
      const actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'action is wrong'
      expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
      // 'actionCreation.data.version is wrong'
      expect(actionCreation.data.version).toBe(CURRENT_VERSION);

      // 'currency is wrong'
      expect(actionCreation.data.parameters.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensionsData is wrong'
      expect(actionCreation.data.parameters.extensionsData).toBeUndefined();
      // 'payer is wrong'
      expect(actionCreation.data.parameters.payer).toBeUndefined();

      // 'actionCreation.data.parameters.payee is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payee');
      // 'actionCreation.data.parameters.payee.type is wrong'
      expect(actionCreation.data.parameters.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payee.value is wrong'
      expect(actionCreation.data.parameters.payee.value).toBe(TestData.payeeRaw.address);

      // 'timestamp is wrong'
      expect(actionCreation.data.parameters.timestamp).toBeDefined();
    });

    it('can create with only the payer', async () => {
      const actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
          timestamp: TestData.arbitraryTimestamp,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
      // 'actionCreation.data.version is wrong'
      expect(actionCreation.data.version).toBe(CURRENT_VERSION);
      // 'currency is wrong'
      expect(actionCreation.data.parameters.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensionsData is wrong'
      expect(actionCreation.data.parameters.extensionsData).toBeUndefined();
      // 'payee is wrong'
      expect(actionCreation.data.parameters.payee).toBeUndefined();

      // 'actionCreation.data.parameters.payer is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payer');
      // 'actionCreation.data.parameters.payer.type is wrong'
      expect(actionCreation.data.parameters.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payer.value is wrong'
      expect(actionCreation.data.parameters.payer.value).toBe(TestData.payerRaw.address);
    });

    it('can create with the payee and the payer', async () => {
      const actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
          timestamp: TestData.arbitraryTimestamp,
        },
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
      // 'actionCreation.data.version is wrong'
      expect(actionCreation.data.version).toBe(CURRENT_VERSION);

      // 'currency is wrong'
      expect(actionCreation.data.parameters.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensionsData is wrong'
      expect(actionCreation.data.parameters.extensionsData).toBeUndefined();

      // 'actionCreation.data.parameters.payee is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payee');
      // 'actionCreation.data.parameters.payee.type is wrong'
      expect(actionCreation.data.parameters.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payee.value is wrong'
      expect(actionCreation.data.parameters.payee.value).toBe(TestData.payeeRaw.address);

      // 'actionCreation.data.parameters.payer is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payer');
      // 'actionCreation.data.parameters.payer.type is wrong'
      expect(actionCreation.data.parameters.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payer.value is wrong'
      expect(actionCreation.data.parameters.payer.value).toBe(TestData.payerRaw.address);
    });

    it(
      'can create with the payee but the payer is a smartcontract',
      async () => {
        const actionCreation = await CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              network: 'private',
              type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
              value: TestData.payerRaw.address,
            } as IdentityTypes.ISmartContractIdentity,
            timestamp: TestData.arbitraryTimestamp,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        );
        // 'action is wrong'
        expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
        // 'actionCreation.data.version is wrong'
        expect(actionCreation.data.version).toBe(CURRENT_VERSION);

        // 'currency is wrong'
        expect(actionCreation.data.parameters.currency).toEqual({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        // 'expectedAmount is wrong'
        expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
        // 'timestamp is wrong'
        expect(actionCreation.data.parameters.timestamp).toBe(TestData.arbitraryTimestamp);
        // 'nonce is wrong'
        expect(actionCreation.data.parameters.nonce).toBeUndefined();
        // 'extensionsData is wrong'
        expect(actionCreation.data.parameters.extensionsData).toBeUndefined();

        // 'actionCreation.data.parameters.payer is wrong'
        expect(actionCreation.data.parameters).toHaveProperty('payer');
        // 'actionCreation.data.parameters.payer.type is wrong'
        expect(actionCreation.data.parameters.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT);
        // 'actionCreation.data.parameters.payer.value is wrong'
        expect(actionCreation.data.parameters.payer.value).toBe(TestData.payerRaw.address);
        // 'actionCreation.data.parameters.payer.network is wrong'
        expect(actionCreation.data.parameters.payer.network).toBe('private');

        // 'actionCreation.data.parameters.payee is wrong'
        expect(actionCreation.data.parameters).toHaveProperty('payee');
        // 'actionCreation.data.parameters.payee.type is wrong'
        expect(actionCreation.data.parameters.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'actionCreation.data.parameters.payee.value is wrong'
        expect(actionCreation.data.parameters.payee.value).toBe(TestData.payeeRaw.address);
      }
    );

    it('cannot create with a smartcontract', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              network: 'rinkeby',
              type: IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
              value: TestData.payeeRaw.address,
            } as IdentityTypes.ISmartContractIdentity,
            timestamp: TestData.arbitraryTimestamp,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('Signer must be the payee or the payer');
    });

    it('cannot create without payee and payer', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: TestData.arbitraryExpectedAmount,
            timestamp: TestData.arbitraryTimestamp,
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('payee or PayerId must be given');
    });

    it('cannot create with amount as decimal', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '0.1234',
            payee: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('expectedAmount must be a positive integer');
    });

    it('cannot create with amount not a number', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: 'NaN',
            payee: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('expectedAmount must be a positive integer');
    });

    it('can format create with extensionsData', async () => {
      const extensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsData,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
          timestamp: TestData.arbitraryTimestamp,
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      // 'action is wrong'
      expect(actionCreation.data.name).toBe(RequestLogicTypes.ACTION_NAME.CREATE);
      // 'currency is wrong'
      expect(actionCreation.data.parameters.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'actionCreation.data.parameters.extensionsData is wrong'
      expect(actionCreation.data.parameters.extensionsData).toEqual(extensionsData);

      // 'actionCreation.data.parameters.payee is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payee');
      // 'actionCreation.data.parameters.payee.type is wrong'
      expect(actionCreation.data.parameters.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payee.value is wrong'
      expect(actionCreation.data.parameters.payee.value).toBe(TestData.payeeRaw.address);

      // 'actionCreation.data.parameters.payer is wrong'
      expect(actionCreation.data.parameters).toHaveProperty('payer');
      // 'actionCreation.data.parameters.payer.type is wrong'
      expect(actionCreation.data.parameters.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'actionCreation.data.parameters.payer.value is wrong'
      expect(actionCreation.data.parameters.payer.value).toBe(TestData.payerRaw.address);
    });

    it('cannot sign with ECDSA by another', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          TestData.otherIdRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('Signer must be the payee or the payer');
    });

    it('cannot sign with ECDSA by payer if only payee given', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          TestData.payerRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('Signer must be the payee or the payer');
    });
    it('cannot sign with ECDSA by payee if only payer given', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: TestData.arbitraryExpectedAmount,
            payer: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('Signer must be the payee or the payer');
    });

    it('can create with amount as integer or zero', async () => {
      let actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: 10000,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe('10000');

      actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: 0,
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      // 'expectedAmount is wrong'
      expect(actionCreation.data.parameters.expectedAmount).toBe('0');
    });

    it('cannot create with amount as negative', () => {
      expect(() =>
        CreateAction.format(
          {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '-1000',
            payee: {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          TestData.payeeRaw.identity,
          TestData.fakeSignatureProvider,
        ),
      ).toThrowError('expectedAmount must be a positive integer');
    });
    it(
      'does not support other identity type than "ethereumAddress" for Payee',
      () => {
        const params: any = {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: '1000',
          payee: {
            type: 'not_ethereumAddress',
            value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
          },
          payer: TestData.payerRaw.identity,
        };
        expect(() =>
          CreateAction.format(params, TestData.payerRaw.identity, TestData.fakeSignatureProvider),
        ).toThrowError('payee: identity type not supported');
      }
    );
    it(
      'does not support other identity type than "ethereumAddress" for Payer',
      () => {
        const params: any = {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: '1000',
          payee: TestData.payeeRaw.identity,
          payer: {
            type: 'not_ethereumAddress',
            value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
          },
        };
        expect(() =>
          CreateAction.format(params, TestData.payeeRaw.identity, TestData.fakeSignatureProvider),
        ).toThrowError('payer: identity type not supported');
      }
    );

    it('does not support other identity value not ethereum for Payee', () => {
      const params: any = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: '1000',
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: 'not valid ethereum',
        },
      };
      expect(() =>
        CreateAction.format(params, TestData.payeeRaw.identity, TestData.fakeSignatureProvider),
      ).toThrowError('payee: identity value must be an ethereum address');
    });

    it('does not support other identity value not ethereum for Payer', () => {
      const params: any = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: '1000',
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: 'not valid ethereum',
        },
      };
      expect(() =>
        CreateAction.format(params, TestData.payeeRaw.identity, TestData.fakeSignatureProvider),
      ).toThrowError('payer: identity value must be an ethereum address');
    });
  });

  describe('createRequest', () => {
    it('can create with only the payee', async () => {
      const createParams = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        timestamp: TestData.arbitraryTimestamp,
      };
      const actionCreation = await CreateAction.format(
        createParams,
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CreateAction.createRequest(actionCreation, 2);

      // 'requestId is wrong'
      expect(request.requestId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)));
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'payer is wrong'
      expect(request.payer).toBeUndefined();

      // 'request.events is wrong'
      expect(request.events[0]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
        timestamp: 2,
      });

      // 'timestamp is wrong'
      expect(request.timestamp).toBe(TestData.arbitraryTimestamp);
    });

    it('can create with nonce', async () => {
      const createParams = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: TestData.arbitraryExpectedAmount,
        nonce: 3,
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        timestamp: TestData.arbitraryTimestamp,
      };
      const actionCreation = await CreateAction.format(
        createParams,
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CreateAction.createRequest(actionCreation, 2);

      // 'requestId is wrong'
      expect(request.requestId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)));
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'payer is wrong'
      expect(request.payer).toBeUndefined();

      // 'request.events is wrong'
      expect(request.events[0]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
        timestamp: 2,
      });

      // 'timestamp is wrong'
      expect(request.timestamp).toBe(TestData.arbitraryTimestamp);
      // 'nonce is wrong'
      expect(request.nonce).toBe(3);
    });

    it('can create with only the payer', async () => {
      const createParams = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: TestData.arbitraryExpectedAmount,
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
      };
      const actionCreation = await CreateAction.format(
        createParams,
        TestData.payerRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CreateAction.createRequest(actionCreation, 2);

      // 'requestId is wrong'
      expect(request.requestId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)));
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.ACCEPTED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payerRaw.address);

      // 'request should have property payer'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
      // 'payee is wrong'
      expect(request.payee).toBeUndefined();
      // 'request.events is wrong'
      expect(request.events[0]).toEqual({
        actionSigner: TestData.payerRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
        timestamp: 2,
      });
    });

    it('can create with the payee and the payer', async () => {
      const createParams = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
        timestamp: TestData.arbitraryTimestamp,
      };
      const actionCreation = await CreateAction.format(
        createParams,
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CreateAction.createRequest(actionCreation, 2);

      // 'requestId is wrong'
      expect(request.requestId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)));
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'extensions is wrong'
      expect(request.extensions).toEqual({});

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }

      // 'request should have property payer'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
      // 'request.events is wrong'
      expect(request.events[0]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
        timestamp: 2,
      });
    });

    it('cannot create without payee and payer', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: TestData.arbitraryExpectedAmount,
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
          },
          version: CURRENT_VERSION,
        },
        signature: TestData.fakeSignature,
      };

      expect(() => CreateAction.createRequest(action, 2)).toThrowError('action.parameters.payee or action.parameters.payer must be given');
    });

    it('cannot create with amount not a number', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: 'Not a Number',
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
          version: CURRENT_VERSION,
        },
        signature: TestData.fakeSignature,
      };

      expect(() => CreateAction.createRequest(action, 2)).toThrowError(
        'action.parameters.expectedAmount must be a string representing a positive integer'
      );
    });

    it('cannot create with amount decimal', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: '0.1234',
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
          version: CURRENT_VERSION,
        },
        signature: TestData.fakeSignature,
      };
      expect(() => CreateAction.createRequest(action, 2)).toThrowError(
        'action.parameters.expectedAmount must be a string representing a positive integer'
      );
    });

    it('cannot create with amount negative', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: '-100000000000',
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
          version: CURRENT_VERSION,
        },
        signature: TestData.fakeSignature,
      };
      expect(() => CreateAction.createRequest(action, 2)).toThrowError(
        'action.parameters.expectedAmount must be a string representing a positive integer'
      );
    });

    it('can create with extensionsData', async () => {
      const extensionsData = [{ id: 'extension1', value: 'whatever' }];
      const createParams = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensionsData,
        payee: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        payer: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
      };
      const actionCreation = await CreateAction.format(
        createParams,
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );

      const request = CreateAction.createRequest(actionCreation, 2);

      // 'requestId is wrong'
      expect(request.requestId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)));
      // 'currency is wrong'
      expect(request.currency).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      // 'state is wrong'
      expect(request.state).toBe(RequestLogicTypes.STATE.CREATED);
      // 'expectedAmount is wrong'
      expect(request.expectedAmount).toBe(TestData.arbitraryExpectedAmount);
      // 'request.extensionsData is wrong'
      expect(request.extensionsData).toEqual(extensionsData);

      // 'request should have property creator'
      expect(request).toHaveProperty('creator');
      // 'request.creator.type is wrong'
      expect(request.creator.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      // 'request.creator.value is wrong'
      expect(request.creator.value).toBe(TestData.payeeRaw.address);

      // 'request should have property payee'
      expect(request).toHaveProperty('payee');
      if (request.payee) {
        // 'request.payee.type is wrong'
        expect(request.payee.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payee.value is wrong'
        expect(request.payee.value).toBe(TestData.payeeRaw.address);
      }
      // 'request should have property payer'
      expect(request).toHaveProperty('payer');
      if (request.payer) {
        // 'request.payer.type is wrong'
        expect(request.payer.type).toBe(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
        // 'request.payer.value is wrong'
        expect(request.payer.value).toBe(TestData.payerRaw.address);
      }
      // 'request.events is wrong'
      expect(request.events[0]).toEqual({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 1,
          isSignedRequest: false,
        },
        timestamp: 2,
      });
    });

    it('cannot create with signature by another', () => {
      const action = {
        data: {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: 'ETH',
            expectedAmount: TestData.arbitraryExpectedAmount,
            extensionsData: [{ id: 'extension1', value: 'whatever' }],
            payee: {
              type: 'ethereumAddress',
              value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
            },
          },
          version: CURRENT_VERSION,
        },
        signature: TestData.fakeSignature,
      };
      expect(() => CreateAction.createRequest(action, 2)).toThrowError('Signer must be the payee or the payer');
    });

    it(
      'does not support other identity type than "ethereumAddress" for Payee',
      () => {
        const action = {
          data: {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: 'not_ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
          signature: TestData.fakeSignature,
        };
        expect(() => CreateAction.createRequest(action, 2)).toThrowError('payee: identity type not supported');
      }
    );

    it(
      'does not support other identity type than "ethereumAddress" for Payer',
      () => {
        const action = {
          data: {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: 'not_ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
          signature: TestData.fakeSignature,
        };
        expect(() => CreateAction.createRequest(action, 2)).toThrowError('payer: identity type not supported');
      }
    );

    it(
      'does not support identity value not being an "ethereumAddress" for Payee',
      () => {
        const action = {
          data: {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
                value: 'not an address',
              },
            },
            version: CURRENT_VERSION,
          },
          signature: TestData.fakeSignature,
        };
        expect(() => CreateAction.createRequest(action, 2)).toThrowError('payee: identity value must be an ethereum address');
      }
    );

    it(
      'does not support identity value not being an "ethereumAddress" for Payer',
      () => {
        const action = {
          data: {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
              payer: {
                type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
                value: 'not an address',
              },
            },
            version: CURRENT_VERSION,
          },
          signature: TestData.fakeSignature,
        };
        expect(() => CreateAction.createRequest(action, 2)).toThrowError('payer: identity value must be an ethereum address');
      }
    );
  });
});
