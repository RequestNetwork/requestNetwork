// import { expect } from 'chai';
import 'mocha';

import {
  DataAccess as DataAccessTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
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
const requestId = '0x80337a0e81cea9499673f668eec3bad626e31b1bf5346dfb8bde1ae22878df5d';

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
      requestLogic.createRequest(createParams, TestData.payeeRaw.signatureParams);

      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"create","parameters":{"currency":"ETH","expectedAmount":"123400000000000000","payee":{"type":"ethereumAddress","value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"},"payer":{"type":"ethereumAddress","value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"}},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xafbd2b18f725f60082f86d8cd87d4c70f957e5988e551911f62391485814a289450e3cb1897c690eb812ba95da078812cf678b5f0544ae20896c0ce9ad4096d21b"}}',
        TestData.payeeRaw.signatureParams,
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
      requestLogic.acceptRequest(acceptParams, TestData.payerRaw.signatureParams);

      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"accept","parameters":{"requestId":"0x80337a0e81cea9499673f668eec3bad626e31b1bf5346dfb8bde1ae22878df5d"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x7a4db0cae7a70060bce038081ed2aefdff8f1662980087e82987735363356bd93dca3556a75f54d04307b7f5bfc2558c5cabbdfef3d21d610bda27464f3a33661b"}}',
        TestData.payerRaw.signatureParams,
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
      requestLogic.cancelRequest(cancelRequest, TestData.payeeRaw.signatureParams);

      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"cancel","parameters":{"requestId":"0x80337a0e81cea9499673f668eec3bad626e31b1bf5346dfb8bde1ae22878df5d"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x12fa1e87a7852dbe6d8e527e68fb4bc9171a14a72a8fcaef92e715840c2f8c993df15a54a54af3e4bbe6f567bb753776547da9fdad1b1ca39e10e0d09f3113821c"}}',
        TestData.payeeRaw.signatureParams,
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

      requestLogic.increaseExpectecAmountRequest(
        increaseRequest,
        TestData.payerRaw.signatureParams,
      );
      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"increaseExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0x80337a0e81cea9499673f668eec3bad626e31b1bf5346dfb8bde1ae22878df5d"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x1b68bbdedecafd4105d4e0fadfeebbb76937fae3a6bb20aa685c81d2ddd6c61b173b9d2b65f021caa3bf31738c72efb424c677f82025eabb704e626643a3155e1b"}}',
        TestData.payerRaw.signatureParams,
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

      requestLogic.reduceExpectecAmountRequest(reduceRequest, TestData.payeeRaw.signatureParams);
      expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"reduceExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0x80337a0e81cea9499673f668eec3bad626e31b1bf5346dfb8bde1ae22878df5d"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x70e3a85e2d2466f2c97263a0bd476871c3835d331557e2299be57e11a43c78b33238e9ae1513b887147e3182473d2d9c20836c6a1c1ef64962181044113854c61b"}}',
        TestData.payeeRaw.signatureParams,
        [requestId],
      );
    });
  });

  describe('getRequestById', () => {
    it('can getRequestById', async () => {
      const actionCreate: Types.IRequestLogicAction = {
        data: {
          name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
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
            '0xafbd2b18f725f60082f86d8cd87d4c70f957e5988e551911f62391485814a289450e3cb1897c690eb812ba95da078812cf678b5f0544ae20896c0ce9ad4096d21b',
        },
      };

      const actionAccept: Types.IRequestLogicAction = {
        data: {
          name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          value:
            '0x7a4db0cae7a70060bce038081ed2aefdff8f1662980087e82987735363356bd93dca3556a75f54d04307b7f5bfc2558c5cabbdfef3d21d610bda27464f3a33661b',
        },
      };
      const rxReduce: Types.IRequestLogicAction = {
        data: {
          name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          value:
            '0x70e3a85e2d2466f2c97263a0bd476871c3835d331557e2299be57e11a43c78b33238e9ae1513b887147e3182473d2d9c20836c6a1c1ef64962181044113854c61b',
        },
      };
      const listActions: Promise<string[]> = new Promise(resolve => {
        return resolve([
          JSON.stringify(actionCreate),
          JSON.stringify(actionAccept),
          JSON.stringify(rxReduce),
        ]);
      });

      const fakeDataAccessGet: DataAccessTypes.IDataAccess = {
        getTransactionsByTopic: () => listActions,
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
            actionSigner: TestData.payeeRaw.identity,
            name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsDataLength: 0,
              isSignedRequest: false,
            },
          },
          {
            actionSigner: TestData.payerRaw.identity,
            name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
            parameters: {
              extensionsDataLength: 0,
            },
          },
          {
            actionSigner: TestData.payeeRaw.identity,
            name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              extensionsDataLength: 0,
            },
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
      const listActions: Promise<string[]> = new Promise(resolve => {
        return resolve(['{NOT a regular JSON}']);
      });

      const fakeDataAccessGet: DataAccessTypes.IDataAccess = {
        getTransactionsByTopic: () => listActions,
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };
      const requestLogic = new RequestLogic(fakeDataAccessGet);

      try {
        await requestLogic.getRequestById(requestId);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Impossible to parse the actions: SyntaxError: Unexpected token N in JSON at position 1',
        );
      }
    });
  });
});
