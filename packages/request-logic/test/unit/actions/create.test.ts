import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import CreateAction from '../../../src/actions/create';

import Version from '../../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('CreateAction', () => {
  describe('format', () => {
    it('can create with only the payee', () => {
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
      expect(txCreation.transaction.action, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION.CREATE,
      );
      expect(
        txCreation.transaction,
        'txCreation.transaction must have the property parameters',
      ).to.have.property('parameters');
      expect(txCreation.transaction.version, 'txCreation.transaction.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(txCreation.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;
      expect(txCreation.transaction.parameters.payer, 'payer is wrong').to.be.undefined;

      expect(
        txCreation.transaction.parameters,
        'txCreation.transaction.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        txCreation.transaction.parameters.payee.type,
        'txCreation.transaction.parameters.payee.type is wrong',
      ).to.equal(Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        txCreation.transaction.parameters.payee.value,
        'txCreation.transaction.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
      expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(
        Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txCreation.signature.value, 'txCreation.signature.value').to.equal(
        '0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c',
      );
    });

    it('can create with only the payer', () => {
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
      expect(txCreation.transaction.action, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION.CREATE,
      );
      expect(
        txCreation.transaction,
        'txCreation.transaction must have the property parameters',
      ).to.have.property('parameters');
      expect(txCreation.transaction.version, 'txCreation.transaction.version is wrong').to.equal(
        CURRENT_VERSION,
      );
      expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(txCreation.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;
      expect(txCreation.transaction.parameters.payee, 'payee is wrong').to.be.undefined;

      expect(
        txCreation.transaction.parameters,
        'txCreation.transaction.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        txCreation.transaction.parameters.payer.type,
        'txCreation.transaction.parameters.payer.type is wrong',
      ).to.equal(Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        txCreation.transaction.parameters.payer.value,
        'txCreation.transaction.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);

      expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
      expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(
        Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txCreation.signature.value, 'txCreation.signature.value').to.equal(
        '0x391371cad6e72ba24f56590fe5d1f7e40b899869ce1088b1761b1a7362e26f23111f52abfe74783a54f3fb12e74f4dc6c63e60b608d8dded8d697b500e23b0a01c',
      );
    });

    it('can create with the payee and the payer', () => {
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
      expect(txCreation.transaction.action, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION.CREATE,
      );
      expect(
        txCreation.transaction,
        'txCreation.transaction must have the property parameters',
      ).to.have.property('parameters');
      expect(txCreation.transaction.version, 'txCreation.transaction.version is wrong').to.equal(
        CURRENT_VERSION,
      );

      expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(txCreation.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;

      expect(
        txCreation.transaction.parameters,
        'txCreation.transaction.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        txCreation.transaction.parameters.payee.type,
        'txCreation.transaction.parameters.payee.type is wrong',
      ).to.equal(Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        txCreation.transaction.parameters.payee.value,
        'txCreation.transaction.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(
        txCreation.transaction.parameters,
        'txCreation.transaction.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        txCreation.transaction.parameters.payer.type,
        'txCreation.transaction.parameters.payer.type is wrong',
      ).to.equal(Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        txCreation.transaction.parameters.payer.value,
        'txCreation.transaction.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);

      expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
      expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(
        Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txCreation.signature.value, 'txCreation.signature.value').to.equal(
        '0xeb37d0492bd0b7c9eb8b0f33dd71f7f25d72a498b6eeacccb6c2510ac08a363642b42f636c63e0adf3a46cb9de9541dc1af8b9ea3bb914dcb5c77127edf850711b',
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
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
        const txCreation = CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: 'NaN',
            payee: {
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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

    it('can create with extensions', () => {
      const extensions = [{ id: 'extension1', value: 'whatever' }];
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensions,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      expect(txCreation, 'txCreation.transaction is wrong').to.have.property('transaction');
      expect(txCreation.transaction.action, 'action is wrong').to.equal(
        Types.REQUEST_LOGIC_ACTION.CREATE,
      );
      expect(
        txCreation.transaction,
        'txCreation.transaction must have the property parameters',
      ).to.have.property('parameters');

      expect(txCreation.transaction.parameters.currency, 'currency is wrong').to.equal(
        Types.REQUEST_LOGIC_CURRENCY.ETH,
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(
        txCreation.transaction.parameters.extensions,
        'txCreation.transaction.parameters.extensions is wrong',
      ).to.equal(extensions);

      expect(
        txCreation.transaction.parameters,
        'txCreation.transaction.parameters.payee is wrong',
      ).to.have.property('payee');
      expect(
        txCreation.transaction.parameters.payee.type,
        'txCreation.transaction.parameters.payee.type is wrong',
      ).to.equal(Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        txCreation.transaction.parameters.payee.value,
        'txCreation.transaction.parameters.payee.value is wrong',
      ).to.equal(TestData.payeeRaw.address);

      expect(
        txCreation.transaction.parameters,
        'txCreation.transaction.parameters.payer is wrong',
      ).to.have.property('payer');
      expect(
        txCreation.transaction.parameters.payer.type,
        'txCreation.transaction.parameters.payer.type is wrong',
      ).to.equal(Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS);
      expect(
        txCreation.transaction.parameters.payer.value,
        'txCreation.transaction.parameters.payer.value is wrong',
      ).to.equal(TestData.payerRaw.address);

      expect(txCreation, 'txCreation.signature is wrong').to.have.property('signature');
      expect(txCreation.signature.method, 'txCreation.signature.method is wrong').to.equal(
        Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      );
      expect(txCreation.signature.value, 'txCreation.signature.value').to.equal(
        '0xf4359003e0fec92ff186edb1c596de83c35d62c97befd4f1a2bc65a216fbcf6b7c8c61de2a4437a8873635a6581d6619dd060641aeaa14b48feb1bc5cb3873fa1c',
      );
    });

    it('cannot sign with ECDSA by another', () => {
      try {
        CreateAction.format(
          {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
            payer: {
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payerRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
      let txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: 10000,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        '10000',
      );

      txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: new bigNumber(TestData.arbitraryExpectedAmount),
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );

      txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: 0,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );
      expect(txCreation.transaction.parameters.expectedAmount, 'expectedAmount is wrong').to.equal(
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
              type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
              value: TestData.payeeRaw.address,
            },
          },
          {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
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
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = CreateAction.createRequest(txCreation);

      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
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
      expect(request.payer, 'payer is wrong').to.be.undefined;

      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsLength: 0,
          isSignedRequest: false,
        },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('can create with only the payer', () => {
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payerRaw.privateKey,
        },
      );

      const request = CreateAction.createRequest(txCreation);
      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
      );
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
        TestData.payerRaw.address,
      );

      expect(request, 'request should have property payer').to.have.property('payer');
      if (request.payer) {
        expect(request.payer.type, 'request.payer.type is wrong').to.equal(
          Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        );
        expect(request.payer.value, 'request.payer.value is wrong').to.equal(
          TestData.payerRaw.address,
        );
      }
      expect(request.payee, 'payee is wrong').to.be.undefined;
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsLength: 0,
          isSignedRequest: false,
        },
        transactionSigner: TestData.payerRaw.identity,
      });
    });

    it('can create with the payee and the payer', () => {
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = CreateAction.createRequest(txCreation);
      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
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
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsLength: 0,
          isSignedRequest: false,
        },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('cannot create without payee and payer', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensions: [{ id: 'extension1', value: 'whatever' }],
            },
            version: CURRENT_VERSION,
          },
        };

        const request = CreateAction.createRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'transaction.parameters.payee or transaction.parameters.payer must be given',
        );
      }
    });

    it('cannot create with amount not a number', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: 'Not a Number',
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: 'ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
        };

        const request = CreateAction.createRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'transaction.parameters.expectedAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot create with amount decimal', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: '0.1234',
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: 'ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
        };

        const request = CreateAction.createRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'transaction.parameters.expectedAmount must be a string representing a positive integer',
        );
      }
    });

    it('cannot create with amount negative', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: '-100000000000',
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: 'ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
        };

        const request = CreateAction.createRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'transaction.parameters.expectedAmount must be a string representing a positive integer',
        );
      }
    });

    it('can create with extensions', () => {
      const extensions = [{ id: 'extension1', value: 'whatever' }];
      const txCreation = CreateAction.format(
        {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensions,
          payee: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payeeRaw.address,
          },
          payer: {
            type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
            value: TestData.payerRaw.address,
          },
        },
        {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          privateKey: TestData.payeeRaw.privateKey,
        },
      );

      const request = CreateAction.createRequest(txCreation);
      expect(request.requestId, 'requestId is wrong').to.equal(
        Utils.crypto.normalizeKeccak256Hash(txCreation.transaction),
      );
      expect(request.currency, 'currency is wrong').to.equal(Types.REQUEST_LOGIC_CURRENCY.ETH);
      expect(request.state, 'state is wrong').to.equal(Types.REQUEST_LOGIC_STATE.CREATED);
      expect(request.expectedAmount, 'expectedAmount is wrong').to.equal(
        TestData.arbitraryExpectedAmount,
      );
      expect(request.extensions, 'request.extensions is wrong').to.deep.equal(extensions);

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
      expect(request.events[0], 'request.events is wrong').to.deep.equal({
        name: Types.REQUEST_LOGIC_ACTION.CREATE,
        parameters: {
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsLength: 1,
          isSignedRequest: false,
        },
        transactionSigner: TestData.payeeRaw.identity,
      });
    });

    it('cannot sign with ECDSA by another', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value: '0x' + 'a'.repeat(130),
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: 'ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
        };

        const request = CreateAction.createRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });

    it('does not support other identity type than "ethereumAddress" for Payee', () => {
      try {
        const signedTx = {
          signature: {
            method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
            value:
              '0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c',
          },
          transaction: {
            action: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              currency: 'ETH',
              expectedAmount: TestData.arbitraryExpectedAmount,
              extensions: [{ id: 'extension1', value: 'whatever' }],
              payee: {
                type: 'not_ethereumAddress',
                value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
              },
            },
            version: CURRENT_VERSION,
          },
        };

        const request = CreateAction.createRequest(signedTx);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Signer must be the payee or the payer',
        );
      }
    });
  });
});
