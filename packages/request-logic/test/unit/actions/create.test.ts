import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

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
      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(actionCreation.data.parameters.timestamp, 'timestamp is wrong').to.equal(
        TestData.arbitraryTimestamp,
      );
      expect(actionCreation.data.parameters.nonce, 'nonce is wrong').to.be.undefined;
      expect(actionCreation.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
      expect(actionCreation.data.parameters.payer, 'payer is wrong').to.be.undefined;

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        actionCreation.data.parameters.payee.type,
        'actionCreation.data.parameters.payee.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);
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
      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(actionCreation.data.parameters.timestamp, 'timestamp is wrong').to.equal(
        TestData.arbitraryTimestamp,
      );
      expect(actionCreation.data.parameters.nonce, 'nonce is wrong').to.equal(2);
      expect(actionCreation.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
      expect(actionCreation.data.parameters.payer, 'payer is wrong').to.be.undefined;

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        actionCreation.data.parameters.payee.type,
        'actionCreation.data.parameters.payee.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);
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
      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(actionCreation.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
      expect(actionCreation.data.parameters.payer, 'payer is wrong').to.be.undefined;

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        actionCreation.data.parameters.payee.type,
        'actionCreation.data.parameters.payee.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(actionCreation.data.parameters.timestamp, 'timestamp is wrong').to.not.be.undefined;
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

      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );
      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(actionCreation.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;
      expect(actionCreation.data.parameters.payee, 'payee is wrong').to.be.undefined;

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        actionCreation.data.parameters.payer.type,
        'actionCreation.data.parameters.payer.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);
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

      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(actionCreation.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        actionCreation.data.parameters.payee.type,
        'actionCreation.data.parameters.payee.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        actionCreation.data.parameters.payer.type,
        'actionCreation.data.parameters.payer.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);
    });

    it('can create with the payee but the payer is a smartcontract', async () => {
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
      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(actionCreation.data.parameters.timestamp, 'timestamp is wrong').to.equal(
        TestData.arbitraryTimestamp,
      );
      expect(actionCreation.data.parameters.nonce, 'nonce is wrong').to.be.undefined;
      expect(actionCreation.data.parameters.extensionsData, 'extensionsData is wrong').to.be
        .undefined;

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        actionCreation.data.parameters.payer.type,
        'actionCreation.data.parameters.payer.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);
      expect(
        actionCreation.data.parameters.payer.network,
        'actionCreation.data.parameters.payer.network is wrong',
      ).to.equal('private');

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        actionCreation.data.parameters.payee.type,
        'actionCreation.data.parameters.payee.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);
    });

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
      ).to.throw('Signer must be the payee or the payer');
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
      ).to.throw('payee or PayerId must be given');
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
      ).to.throw('expectedAmount must be a positive integer');
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
      ).to.throw('expectedAmount must be a positive integer');
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

      expect(actionCreation.data.name, 'action is wrong').to.equal(
        RequestLogicTypes.ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(
        actionCreation.data.parameters.extensionsData,
        'actionCreation.data.parameters.extensionsData is wrong',
      ).to.deep.equal(extensionsData);

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        actionCreation.data.parameters.payee.type,
        'actionCreation.data.parameters.payee.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(
        actionCreation.data.parameters,
        'actionCreation.data.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        actionCreation.data.parameters.payer.type,
        'actionCreation.data.parameters.payer.type is wrong',
      ).to.equal(IdentityTypes.TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);
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
      ).to.throw('Signer must be the payee or the payer');
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
      ).to.throw('Signer must be the payee or the payer');
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
      ).to.throw('Signer must be the payee or the payer');
    });

    it('can create with amount as integer, bigNumber or zero', async () => {
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
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        '10000',
      );

      actionCreation = await CreateAction.format(
        {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: new bigNumber(TestData.arbitraryExpectedAmount),
          payee: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        TestData.payeeRaw.identity,
        TestData.fakeSignatureProvider,
      );
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );

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
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        '0',
      );
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
      ).to.throw('expectedAmount must be a positive integer');
    });
    it('does not support other identity type than "ethereumAddress" for Payee', () => {
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
      ).to.throw('payee: identity type not supported');
    });
    it('does not support other identity type than "ethereumAddress" for Payer', () => {
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
      ).to.throw('payer: identity type not supported');
    });

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
      ).to.throw('payee: identity value must be an ethereum address');
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
      ).to.throw('payer: identity value must be an ethereum address');
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

      expect(request.requestId, 'requestId is wrong').to.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)),
      );
      expect(request.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.CREATED);
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
      expect(request.payer, 'payer is wrong').to.be.undefined;

      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
        timestamp: 2,
      });

      expect(request.timestamp, 'timestamp is wrong').to.equal(TestData.arbitraryTimestamp);
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

      expect(request.requestId, 'requestId is wrong').to.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)),
      );
      expect(request.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.CREATED);
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
      expect(request.payer, 'payer is wrong').to.be.undefined;

      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
        timestamp: 2,
      });

      expect(request.timestamp, 'timestamp is wrong').to.equal(TestData.arbitraryTimestamp);
      expect(request.nonce, 'nonce is wrong').to.equal(3);
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

      expect(request.requestId, 'requestId is wrong').to.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)),
      );
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
        TestData.payerRaw.address,
      );

      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.payee, 'payee is wrong').to.be.undefined;
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
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

      expect(request.requestId, 'requestId is wrong').to.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)),
      );
      expect(request.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.CREATED);
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
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
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

      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'action.parameters.payee or action.parameters.payer must be given',
      );
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

      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'action.parameters.expectedAmount must be a string representing a positive integer',
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'action.parameters.expectedAmount must be a string representing a positive integer',
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'action.parameters.expectedAmount must be a string representing a positive integer',
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

      expect(request.requestId, 'requestId is wrong').to.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(actionCreation)),
      );
      expect(request.currency, 'currency is wrong').to.deep.equal({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(request.state, 'state is wrong').to.equal(RequestLogicTypes.STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        extensionsData,
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
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'Signer must be the payee or the payer',
      );
    });

    it('does not support other identity type than "ethereumAddress" for Payee', () => {
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'payee: identity type not supported',
      );
    });

    it('does not support other identity type than "ethereumAddress" for Payer', () => {
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'payer: identity type not supported',
      );
    });

    it('does not support identity value not being an "ethereumAddress" for Payee', () => {
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'payee: identity value must be an ethereum address',
      );
    });

    it('does not support identity value not being an "ethereumAddress" for Payer', () => {
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
      expect(() => CreateAction.createRequest(action, 2)).to.throw(
        'payer: identity value must be an ethereum address',
      );
    });
  });
});
