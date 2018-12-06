import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import CreateAction from '../../../src/actions/create';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('CreateAction', () => {
  describe('format', () => {
    it('can create with only the payee', () => {
      const actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(actionCreation.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
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
      ).to.equal(IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payee.value,
        'actionCreation.data.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(actionCreation, 'actionCreation.signature is wrong').to.have.property('signature');
      expect(actionCreation.signature.method, 'actionCreation.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(actionCreation.signature.value, 'actionCreation.signature.value').to.equal(
        '0x61eaf32987bd3aecb095ccadd0dcef4e6c6d2e3f10d08774e3aa98c28e9b0bee79c9275409214ab46b240f4b024e42fce30f27eb014dde5ef533971d061bdf6a1c',
      );
    });

    it('can create with only the payer', () => {
      const actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(actionCreation.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );
      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
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
      ).to.equal(IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);

      expect(actionCreation, 'actionCreation.signature is wrong').to.have.property('signature');
      expect(actionCreation.signature.method, 'actionCreation.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(actionCreation.signature.value, 'actionCreation.signature.value').to.equal(
        '0xd8bea6f91376660c7cb1bb947eedd13028299b4730bfb3caec69abdc6f79f913208b249b7dcb46838bb6467680c3a01b49446ec51de98ed3b46a9aa0049d515a1c',
      );
    });

    it('can create with the payee and the payer', () => {
      const actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(actionCreation.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.version, 'actionCreation.data.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
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
      ).to.equal(IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS);
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
      ).to.equal(IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);

      expect(actionCreation, 'actionCreation.signature is wrong').to.have.property('signature');
      expect(actionCreation.signature.method, 'actionCreation.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(actionCreation.signature.value, 'actionCreation.signature.value').to.equal(
        '0x54c3862abd043239d286bcc67e010174c10b52df0cbde27fd4788b282f06a490305e4d8b80a8d35e991e4e6da9026f29c7da641c4bc8a714eec771f6a1eacca11c',
      );
    });
    it('cannot create without payee and payer', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('payee or PayerId must be given');
      }
    });

    it('cannot create with amount as decimal', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: '0.1234',
            payee: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'expectedAmount must be a positive integer',
        );
      }
    });

    it('cannot create with amount not a number', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: 'NaN',
            payee: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'expectedAmount must be a positive integer',
        );
      }
    });

    it('can format create with extensionsData', () => {
      const extensionsData = [{ id: 'extension1', value: 'whatever' }];
      const actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsData,
          payee: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(actionCreation.data.name, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
      );
      expect(actionCreation.data.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
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
      ).to.equal(IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS);
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
      ).to.equal(IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        actionCreation.data.parameters.payer.value,
        'actionCreation.data.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);

      expect(actionCreation, 'actionCreation.signature is wrong').to.have.property('signature');
      expect(actionCreation.signature.method, 'actionCreation.signature.method is wrong').to.equal(
        SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
      );
      expect(actionCreation.signature.value, 'actionCreation.signature.value').to.equal(
        '0xa0d832fbdaee980d13a991d1930bc109fb08ec0f992c1a54a2f3c2494167b18c42da2753f87ca1a830ed0a16f9b599e1961a81fa75dfb0f79097cafc042fc64f1b',
      );
    });

    it('cannot sign with ECDSA by another', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.otherIdRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });

    it('cannot sign with ECDSA by payer if only payee given', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payerRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });
    it('cannot sign with ECDSA by payee if only payer given', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payer: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });

    it('can create with amount as integer, bigNumber or zero', () => {
      let actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: 10000,
          payee: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        '10000',
      );

      actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: new bigNumber(TestData.arbitraryExpectedAmount),
          payee: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );

      actionCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: 0,
          payee: {
            type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(actionCreation.data.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        '0',
      );
    });

    it('cannot create with amount as negative', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: '-1000',
            payee: {
              type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            privateKey: TestData.payeeRaw.privateKey,
          },
        );
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'expectedAmount must be a positive integer',
        );
      }
    });
    it('does not support other identity type than "ethereumAddress" for Payee', () => {
      try {
        const params: any = {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: '1000',
          payee: {
            type: 'not_ethereumAddress',
            value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
          },
        };
        CreateAction.format(params, {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        });

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('payee.type not supported');
      }
    });
    it('does not support other identity type than "ethereumAddress" for Payer', () => {
      try {
        const params: any = {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: '1000',
          payer: {
            type: 'not_ethereumAddress',
            value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
          },
        };
        CreateAction.format(params, {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        });

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('payer.type not supported');
      }
    });
  });
  describe('createRequest', () => {
    it('can create with only the payee', () => {
      const createParams = {
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
      };
      const actionCreation = CreateAction.format(createParams, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });

      const request = CreateAction.createRequest(actionCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash({
          name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
          parameters: createParams,
          version: CURRENT_VERSION,
        }),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
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
      expect(request.payer, 'payer is wrong').to.be.undefined;

      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
      });
    });

    it('can create with only the payer', () => {
      const createParams = {
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: TestData.arbitraryExpectedAmount,
        payer: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
      };
      const actionCreation = CreateAction.format(createParams, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payerRaw.privateKey,
      });

      const request = CreateAction.createRequest(actionCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash({
          name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
          parameters: createParams,
          version: CURRENT_VERSION,
        }),
      );
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
        TestData.payerRaw.address,
      );

      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.payee, 'payee is wrong').to.be.undefined;
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payerRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
      });
    });

    it('can create with the payee and the payer', () => {
      const createParams = {
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        payer: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
      };
      const actionCreation = CreateAction.format(createParams, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });

      const request = CreateAction.createRequest(actionCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash({
          name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
          parameters: createParams,
          version: CURRENT_VERSION,
        }),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
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
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 0,
          isSignedRequest: false,
        },
      });
    });

    it('cannot create without payee and payer', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensionsData: [{ id: 'extension1', value: 'whatever' }],
            },
            version: CURRENT_VERSION,
          },
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        CreateAction.createRequest(action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'action.parameters.payee or action.parameters.payer must be given',
        );
      }
    });

    it('cannot create with amount not a number', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
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
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        CreateAction.createRequest(action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'action.parameters.expectedAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot create with amount decimal', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
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
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        CreateAction.createRequest(action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'action.parameters.expectedAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot create with amount negative', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
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
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        CreateAction.createRequest(action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'action.parameters.expectedAmount must be a string representing a positive integer',
        );
      }
    });

    it('can create with extensionsData', () => {
      const extensionsData = [{ id: 'extension1', value: 'whatever' }];
      const createParams = {
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensionsData,
        payee: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        payer: {
          type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
          value: TestData.payerRaw.address,
        },
      };
      const actionCreation = CreateAction.format(createParams, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });

      const request = CreateAction.createRequest(actionCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash({
          name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
          parameters: createParams,
          version: CURRENT_VERSION,
        }),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensionsData, 'request.extensionsData is wrong').to.deep.equal(
        extensionsData,
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
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        actionSigner: TestData.payeeRaw.identity,
        name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsDataLength: 1,
          isSignedRequest: false,
        },
      });
    });

    it('cannot sign with ECDSA by another', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
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
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            // tslint:disable:no-magic-numbers
            value: '0x' + 'a'.repeat(130),
          },
        };

        CreateAction.createRequest(action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });

    it('does not support other identity type than "ethereumAddress" for Payee', () => {
      try {
        const action = {
          data: {
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
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
          signature: {
            method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
        };

        CreateAction.createRequest(action);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });
  });
});
