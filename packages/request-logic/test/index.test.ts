// import { expect } from 'chai';
import 'mocha';

import {
  RequestLogic as Types,
  Signature as SignatureTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

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
      const requestLogic = new RequestLogic(
        fakeTransactionManager,
        TestData.fakeSignatureProviderArbitrary,
      );
      const ret = await requestLogic.createRequest(createParams, TestData.payeeRaw.identity);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"create","parameters":{"currency":"ETH","expectedAmount":"123400000000000000","payee":{"type":"ethereumAddress","value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"},"payer":{"type":"ethereumAddress","value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"},"timestamp":1544426030},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c"}}',
        [requestId],
      );
    });

    it('cannot createRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);

      try {
        await requestLogic.createRequest(createParams, TestData.payeeRaw.identity);
        expect(false, 'must have thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'wrong exception').to.equal(
          'You must give a signature provider to create actions',
        );
      }
    });
  });

  describe('acceptRequest', () => {
    it('can acceptRequest', async () => {
      const acceptParams = {
        requestId,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManager,
        TestData.fakeSignatureProviderArbitrary,
      );
      const ret = await requestLogic.acceptRequest(acceptParams, TestData.payerRaw.identity);

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"accept","parameters":{"requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c"}}',
        [requestId],
      );
    });
    it('cannot acceptRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const acceptParams = {
        requestId,
      };

      try {
        await requestLogic.acceptRequest(acceptParams, TestData.payeeRaw.identity);
        expect(false, 'must have thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'wrong exception').to.equal(
          'You must give a signature provider to create actions',
        );
      }
    });
  });

  describe('cancelRequest', () => {
    it('can cancelRequest', async () => {
      const cancelRequest = {
        requestId,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManager,
        TestData.fakeSignatureProviderArbitrary,
      );
      const ret = await requestLogic.cancelRequest(cancelRequest, TestData.payeeRaw.identity);
      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"cancel","parameters":{"requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c"}}',
        [requestId],
      );
    });
    it('cannot cancelRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const cancelParams = {
        requestId,
      };

      try {
        await requestLogic.cancelRequest(cancelParams, TestData.payeeRaw.identity);
        expect(false, 'must have thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'wrong exception').to.equal(
          'You must give a signature provider to create actions',
        );
      }
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('can increaseExpectedAmountRequest', async () => {
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManager,
        TestData.fakeSignatureProviderArbitrary,
      );

      const ret = await requestLogic.increaseExpectedAmountRequest(
        increaseRequest,
        TestData.payerRaw.identity,
      );
      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"increaseExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c"}}',
        [requestId],
      );
    });
    it('cannot increaseExpectedAmountRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };

      try {
        await requestLogic.increaseExpectedAmountRequest(
          increaseRequest,
          TestData.payeeRaw.identity,
        );
        expect(false, 'must have thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'wrong exception').to.equal(
          'You must give a signature provider to create actions',
        );
      }
    });
  });

  describe('reduceExpectedAmountRequest', () => {
    it('can reduceExpectedAmountRequest', async () => {
      const reduceRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManager,
        TestData.fakeSignatureProviderArbitrary,
      );

      const ret = await requestLogic.reduceExpectedAmountRequest(
        reduceRequest,
        TestData.payeeRaw.identity,
      );
      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });
      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        '{"data":{"name":"reduceExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0xd251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xdd44c2d34cba689921c60043a78e189b4aa35d5940723bf98b9bb9083385de316333204ce3bbeced32afe2ea203b76153d523d924c4dca4a1d9fc466e0160f071c"}}',
        [requestId],
      );
    });
    it('cannot reduceExpectedAmountRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const reduceRequest = {
        deltaAmount: '1000',
        requestId,
      };

      try {
        await requestLogic.reduceExpectedAmountRequest(reduceRequest, TestData.payeeRaw.identity);
        expect(false, 'must have thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'wrong exception').to.equal(
          'You must give a signature provider to create actions',
        );
      }
    });
  });

  describe('getRequestById', () => {
    it('can getRequestById', async () => {
      const actionCreate: Types.IRequestLogicAction = Utils.signature.sign(
        {
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
        TestData.payeeRaw.signatureParams,
      );

      const actionAccept: Types.IRequestLogicAction = Utils.signature.sign(
        {
          name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: Types.IRequestLogicAction = Utils.signature.sign(
        {
          name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

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
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProviderArbitrary,
      );

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

    it('cannot getRequestById on corrupted data (not parsable JSON)', async () => {
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
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProviderArbitrary,
      );

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
