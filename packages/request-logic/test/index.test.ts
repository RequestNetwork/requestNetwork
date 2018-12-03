// import { expect } from 'chai';
import 'mocha';

import {
  DataAccess as DataAccessTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import RequestLogic from '../src/index';
import * as TestData from './unit/utils/test-data-generator';

import Version from '../src/version';
const CURRENT_VERSION = Version.currentVersion;

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;

chai.use(spies);

const createParams = {
  currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: TestData.arbitraryExpectedAmount,
  payee: TestData.payeeRaw.identity,
  payer: TestData.payerRaw.identity,
};
const requestId = '0x01f7f2db93b34f593812b8c7950fd472e606a42b535cf0ddd7523570217042aa';

const fakeDataAccess: DataAccessTypes.IDataAccess = {
  getTransactionsByTopic: chai.spy(),
  initialize: chai.spy(),
  persistTransaction: chai.spy(),
};

/* tslint:disable:no-unused-expression */
describe('index', () => {
  describe('createRequest', () => {
    it('can createRequest', async () => {
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.createRequest(createParams, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });

      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"action":"create","parameters":{"currency":"ETH","expectedAmount":"123400000000000000","payee":{"type":"ethereumAddress","value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"},"payer":{"type":"ethereumAddress","value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"}},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xfbbe97a8c095d1379db035dc96ccdfdd7bc633b30dc8b6a6b4a97bb60a855a8172972cba0ab2dd817ec6786b0e70c413f279a1ce406cc155ddecefbf2048502b1b"}}',
        [requestId],
      );
    });
  });

  describe('acceptRequest', () => {
    it('can acceptRequest', async () => {
      const acceptParams = {
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.acceptRequest(acceptParams, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payerRaw.privateKey,
      });
      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"action":"accept","parameters":{"requestId":"0x01f7f2db93b34f593812b8c7950fd472e606a42b535cf0ddd7523570217042aa"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x6778e3b660d4035282a115d418729c2b02d98a671f31147da1e4e926588781e85733be4a4e263118fbf5811bb6395c3875ea38906adf1b518cd4a2e932c87d121b"}}',
        [requestId],
      );
    });
  });

  describe('cancelRequest', () => {
    it('can cancelRequest', async () => {
      const cancelRequest = {
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.cancelRequest(cancelRequest, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });
      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"action":"cancel","parameters":{"requestId":"0x01f7f2db93b34f593812b8c7950fd472e606a42b535cf0ddd7523570217042aa"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x144e230f3750ea8c588f5f40a39a2a6475ad6622aaef7b7215e26393688fba705e16eb8495b41c73157fb4ee4705d61ab55e49211c9d8db3e78c9ee5859ac11f1b"}}',
        [requestId],
      );
    });
  });

  describe('increaseExpectecAmountRequest', () => {
    it('can increaseExpectecAmountRequest', async () => {
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.increaseExpectecAmountRequest(increaseRequest, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payerRaw.privateKey,
      });
      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"action":"increaseExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0x01f7f2db93b34f593812b8c7950fd472e606a42b535cf0ddd7523570217042aa"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xc535f9d1e4fdeef27572e4a6149cbfc5fe83e6aaf8d0a787251bc387557b1a8e0988c678c6e74cc01f6bc4bd0e5f957ac2234eaaa21d733e20c9a05965088cc71c"}}',
        [requestId],
      );
    });
  });

  describe('reduceExpectecAmountRequest', () => {
    it('can reduceExpectecAmountRequest', async () => {
      const reduceRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.reduceExpectecAmountRequest(reduceRequest, {
        method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });
      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"action":"reduceExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0x01f7f2db93b34f593812b8c7950fd472e606a42b535cf0ddd7523570217042aa"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xaa121e72ebd5ddaf9eea3e29da1f8982a5bfba616e34c03419b513ef3b33a643639aebf709d10ebc0f1c74c4dcbbba497cdd16eec3b5f2af583b9e2ff8aadcc41c"}}',
        [requestId],
      );
    });
  });

  describe('getRequestById', () => {
    it('can getRequestById', async () => {
      const txCreate = {
        data: {
          action: Types.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          value:
            '0xfbbe97a8c095d1379db035dc96ccdfdd7bc633b30dc8b6a6b4a97bb60a855a8172972cba0ab2dd817ec6786b0e70c413f279a1ce406cc155ddecefbf2048502b1b',
        },
      };
      const txAccept = {
        data: {
          action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          value:
            '0x6778e3b660d4035282a115d418729c2b02d98a671f31147da1e4e926588781e85733be4a4e263118fbf5811bb6395c3875ea38906adf1b518cd4a2e932c87d121b',
        },
      };
      const rxReduce = {
        data: {
          action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          value:
            '0xaa121e72ebd5ddaf9eea3e29da1f8982a5bfba616e34c03419b513ef3b33a643639aebf709d10ebc0f1c74c4dcbbba497cdd16eec3b5f2af583b9e2ff8aadcc41c',
        },
      };
      const listTxs: Promise<string[]> = new Promise(resolve => {
        return resolve([
          JSON.stringify(txCreate),
          JSON.stringify(txAccept),
          JSON.stringify(rxReduce),
        ]);
      });

      const fakeDataAccessGet: DataAccessTypes.IDataAccess = {
        getTransactionsByTopic: (index: string) => listTxs,
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };
      const requestLogic = new RequestLogic(fakeDataAccessGet);

      const request = await requestLogic.getRequestById(requestId);

      expect(request, 'request result is wrong').to.deep.equal({
        creator: TestData.payeeRaw.identity,
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [
          {
            name: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsDataLength: 0,
              isSignedRequest: false,
            },
            transactionSigner: TestData.payeeRaw.identity,
          },
          {
            name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              extensionsDataLength: 0,
            },
            transactionSigner: TestData.payerRaw.identity,
          },
          {
            name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              extensionsDataLength: 0,
            },
            transactionSigner: TestData.payeeRaw.identity,
          },
        ],
        expectedAmount: '123399999999999000',
        payee: TestData.payeeRaw.identity,
        payer: TestData.payerRaw.identity,
        requestId,
        state: Types.REQUEST_LOGIC_STATE.ACCEPTED,
        version: CURRENT_VERSION,
      });
    });

    it('cannnot getRequestById on corrupted data (not parsable JSON)', async () => {
      const listTxs: Promise<string[]> = new Promise(resolve => {
        return resolve(['{NOT a regular JSON}']);
      });

      const fakeDataAccessGet: DataAccessTypes.IDataAccess = {
        getTransactionsByTopic: (index: string) => listTxs,
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };
      const requestLogic = new RequestLogic(fakeDataAccessGet);

      try {
        const request = await requestLogic.getRequestById(requestId);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Impossible to parse the transactions',
        );
      }
    });
  });
});
