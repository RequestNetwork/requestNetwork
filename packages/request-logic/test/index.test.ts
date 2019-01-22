// import { expect } from 'chai';
import 'mocha';

import {
  RequestLogic as Types,
  Signature as SignatureTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import { RequestLogic } from '../src/index';
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
  timestamp: 1544426030,
};
const requestId = '0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905';
const fakeTxHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const fakeMetaTransactionManager = {
  meta: { storageDataId: 'fakeDataId' },
  result: { topics: [fakeTxHash] },
};
const fakeTransactionManager: TransactionTypes.ITransactionManager = {
  getTransactionsByTopic: chai.spy(),
  persistTransaction: chai.spy.returns(fakeMetaTransactionManager),
};

/* tslint:disable:no-unused-expression */
describe('index', () => {
  describe('createRequest', () => {
    it('can createRequest', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const ret = await requestLogic.createRequest(createParams, TestData.payeeRaw.signatureParams);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"create","parameters":{"currency":"ETH","expectedAmount":"123400000000000000","payee":{"type":"ethereumAddress","value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"},"payer":{"type":"ethereumAddress","value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"},"timestamp":1544426030},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xac9e9e43381d882f3edc506277b8ad74ca3fc0ed2184663b65ccbab921df114807d7e68fd03b668afffee1feb977c9082657f1a05f57c0b1f92e9b46ca22dfc31c"}}',
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
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const ret = await requestLogic.acceptRequest(acceptParams, TestData.payerRaw.signatureParams);

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"accept","parameters":{"requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xf94380c553c90810deb5625571649759f8591bf923f5773e436fec322d01752d676a6f822dee2c2097f4bb70b16273b4826e6026f9f98a31cfafab8f1bdda2eb1b"}}',
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
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const ret = await requestLogic.cancelRequest(
        cancelRequest,
        TestData.payeeRaw.signatureParams,
      );
      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"cancel","parameters":{"requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xdeea8e4881abea508a85a5e45836009acbfb4ed17a85226da268cc7330fb570b604a86d101a9d26279da80136412fdf820465fe05053e067c223e269fcca9a501c"}}',
        TestData.payeeRaw.signatureParams,
        [requestId],
      );
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('can increaseExpectedAmountRequest', async () => {
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager);

      const ret = await requestLogic.increaseExpectedAmountRequest(
        increaseRequest,
        TestData.payerRaw.signatureParams,
      );
      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"increaseExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x23b0c5cbe796e96078a1474c389bef434365b9ea63ed163794b2a2a24d29cf1677586ab2fd06312f54cd136c696ae716159fe351e582867d59c405c4d1e609c21b"}}',
        TestData.payerRaw.signatureParams,
        [requestId],
      );
    });
  });

  describe('reduceExpectedAmountRequest', () => {
    it('can reduceExpectedAmountRequest', async () => {
      const reduceRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager);

      const ret = await requestLogic.reduceExpectedAmountRequest(
        reduceRequest,
        TestData.payeeRaw.signatureParams,
      );
      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });
      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"reduceExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xe626d971dfdcb794a08b6a816c8a1ab83ec5d33be82be83efb6801f0033c17c46ea4e37ec92b2d8fa370fd5cb8960fd4ca7c0246832e70706bab6275517e34541c"}}',
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
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        signature: {
          method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
          value:
            '0xac9e9e43381d882f3edc506277b8ad74ca3fc0ed2184663b65ccbab921df114807d7e68fd03b668afffee1feb977c9082657f1a05f57c0b1f92e9b46ca22dfc31c',
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
            '0xf94380c553c90810deb5625571649759f8591bf923f5773e436fec322d01752d676a6f822dee2c2097f4bb70b16273b4826e6026f9f98a31cfafab8f1bdda2eb1b',
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
            '0xe626d971dfdcb794a08b6a816c8a1ab83ec5d33be82be83efb6801f0033c17c46ea4e37ec92b2d8fa370fd5cb8960fd4ca7c0246832e70706bab6275517e34541c',
        },
      };
      const meta = {};
      const listActions: Promise<
        TransactionTypes.IRequestDataReturnGetTransactionsByTopic
      > = Promise.resolve({
        meta,
        result: {
          transactions: [
            {
              data: JSON.stringify(actionCreate),
              signature: { method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA, value: '0x0' },
            },
            {
              data: JSON.stringify(actionAccept),
              signature: { method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA, value: '0x0' },
            },
            {
              data: JSON.stringify(rxReduce),
              signature: { method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA, value: '0x0' },
            },
          ],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getTransactionsByTopic: (): Promise<
          TransactionTypes.IRequestDataReturnGetTransactionsByTopic
        > => listActions,
        persistTransaction: chai.spy(),
      };
      const requestLogic = new RequestLogic(fakeTransactionManagerGet);

      const request = await requestLogic.getRequestById(requestId);

      expect(request, 'request result is wrong').to.deep.equal({
        meta: {
          transactionManagerMeta: meta,
        },
        result: {
          request: {
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
            extensions: {},
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            requestId,
            state: Types.REQUEST_LOGIC_STATE.ACCEPTED,
            timestamp: 1544426030,
            version: CURRENT_VERSION,
          },
        },
      });
    });

    it('cannnot getRequestById on corrupted data (not parsable JSON)', async () => {
      const listActions: Promise<
        TransactionTypes.IRequestDataReturnGetTransactionsByTopic
      > = Promise.resolve({
        meta: {},
        result: {
          transactions: [
            {
              data: '{NOT parsable}',
              signature: { method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA, value: '0x0' },
            },
          ],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getTransactionsByTopic: (): Promise<
          TransactionTypes.IRequestDataReturnGetTransactionsByTopic
        > => listActions,
        persistTransaction: chai.spy(),
      };
      const requestLogic = new RequestLogic(fakeTransactionManagerGet);

      try {
        await requestLogic.getRequestById(requestId);

        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'Unexpected token N in JSON at position 1',
        );
      }
    });
  });
});
