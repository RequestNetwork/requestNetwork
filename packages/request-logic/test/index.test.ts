import * as sinon from 'sinon';

import { EventEmitter } from 'events';

import MultiFormat from '@requestnetwork/multi-format';
import { AdvancedLogicTypes, RequestLogicTypes, TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { RequestLogic } from '../src/index';
import * as TestData from './unit/utils/test-data-generator';

import Version from '../src/version';

const CURRENT_VERSION = Version.currentVersion;

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

chai.use(chaiAsPromised);
chai.use(spies);
const expect = chai.expect;

const createParams: RequestLogicTypes.ICreateParameters = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
  },
  expectedAmount: TestData.arbitraryExpectedAmount,
  payee: TestData.payeeRaw.identity,
  payer: TestData.payerRaw.identity,
  timestamp: 1544426030,
};
const unsignedAction: RequestLogicTypes.IUnsignedAction = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: createParams,
  version: CURRENT_VERSION,
};
const action = Utils.signature.sign(unsignedAction, TestData.payeeRaw.signatureParams);
const requestId = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(action));

const fakeTxHash = '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const fakeMetaTransactionManager = {
  meta: { storageDataId: 'fakeDataId' },
  result: { topics: [fakeTxHash] },
};
let fakeTransactionManager: TransactionTypes.ITransactionManager;

/* tslint:disable:no-unused-expression */
describe('index', () => {
  beforeEach(() => {
    fakeTransactionManager = {
      getChannelsByMultipleTopics: chai.spy() as any,
      getChannelsByTopic: chai.spy() as any,
      getTransactionsByChannelId: chai.spy() as any,
      persistTransaction: chai.spy(() => {
        const fakeMetaTransactionManagerWithEvent = Object.assign(
          new EventEmitter(),
          fakeMetaTransactionManager,
        );
        setTimeout(() => {
          fakeMetaTransactionManagerWithEvent.emit(
            'confirmed',
            {
              meta: { storageDataId: 'fakeDataId' },
              result: { topics: [fakeTxHash] },
            },
            // tslint:disable-next-line:no-magic-numbers
            100,
          );
        });

        return fakeMetaTransactionManagerWithEvent;
      }) as any,

      // chai.spy.returns(fakeMetaTransactionManager) as any,
    };
  });

  describe('createRequest', () => {
    it('cannot createRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);

      await expect(
        requestLogic.createRequest(createParams, TestData.payeeRaw.identity),
      ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
    });

    it(
      'cannot createRequest if apply fails in the advanced request logic',
      async () => {
        const fakeAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
          applyActionToExtensions: (): RequestLogicTypes.IExtensionStates => {
            throw new Error('Expected throw');
          },
          extensions: {},
        };

        const requestLogic = new RequestLogic(
          fakeTransactionManager,
          TestData.fakeSignatureProvider,
          fakeAdvancedLogic,
        );

        const createParamsWithExtensions: RequestLogicTypes.ICreateParameters = {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsData: ['whatever'],
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544426030,
        };

        await expect(
          requestLogic.createRequest(createParamsWithExtensions, TestData.payeeRaw.identity),
        ).to.eventually.be.rejectedWith('Expected throw');
      }
    );

    it('can createRequest', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const ret = await requestLogic.createRequest(createParams, TestData.payeeRaw.identity);

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
          result: {
            requestId: '010246b8aeb3aa72f4c7039284bf7307c3d543541ff309ee52e9361f4bd2c89c9c',
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(action),
        requestId,
      );
    });

    it('can createRequest with topics', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const ret = await requestLogic.createRequest(createParams, TestData.payeeRaw.identity, [
        TestData.payeeRaw.identity,
        TestData.payerRaw.identity,
      ]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(action),
        requestId,
        [
          MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(TestData.payeeRaw.identity)),
          MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(TestData.payerRaw.identity)),
        ],
      );
    });

    it('can createRequest if persist emit error', async () => {
      const clock = sinon.useFakeTimers();
      const fakeTransactionManagerEmittingError = Object.assign({}, fakeTransactionManager);
      fakeTransactionManagerEmittingError.persistTransaction = chai.spy(
        (): any => {
          const fakeTransactionManagerWithEvent = Object.assign(
            new EventEmitter(),
            fakeMetaTransactionManager,
          );
          setTimeout(() => {
            // tslint:disable-next-line:no-magic-numbers
            fakeTransactionManagerWithEvent.emit('error', 'error for test purpose', 10);
          });
          return fakeTransactionManagerWithEvent;
        },
      );

      const requestLogic = new RequestLogic(
        fakeTransactionManagerEmittingError,
        TestData.fakeSignatureProvider,
      );
      const ret = await requestLogic.createRequest(createParams, TestData.payeeRaw.identity);

      // tslint:disable-next-line:typedef
      const handleError = chai.spy((error: any) => {
        expect(error, 'error wrong').to.deep.equal('error for test purpose');
      });
      ret.on('error', handleError);

      clock.tick(11);

      expect(handleError, 'error must be emitted').to.have.called();

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManagerEmittingError.persistTransaction).to.have.been.called.with(
        JSON.stringify(action),
        requestId,
      );
      sinon.restore();
    });
  });

  describe('createEncryptedRequest', () => {
    it(
      'cannot create encrypted request without signature provider',
      async () => {
        const requestLogic = new RequestLogic(fakeTransactionManager);

        await expect(
          requestLogic.createEncryptedRequest(createParams, TestData.payeeRaw.identity, [
            TestData.payeeRaw.encryptionParams,
            TestData.payerRaw.encryptionParams,
          ]),
        ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
      }
    );

    it(
      'cannot create an encrypted request if apply fails in the advanced request logic',
      async () => {
        const fakeAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
          applyActionToExtensions: (): RequestLogicTypes.IExtensionStates => {
            throw new Error('Expected throw');
          },
          extensions: {},
        };

        const requestLogic = new RequestLogic(
          fakeTransactionManager,
          TestData.fakeSignatureProvider,
          fakeAdvancedLogic,
        );

        const createParamsWithExtensions: RequestLogicTypes.ICreateParameters = {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsData: ['whatever'],
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544426030,
        };

        await expect(
          requestLogic.createEncryptedRequest(
            createParamsWithExtensions,
            TestData.payeeRaw.identity,
            [TestData.payeeRaw.encryptionParams, TestData.payerRaw.encryptionParams],
          ),
        ).to.eventually.be.rejectedWith('Expected throw');
      }
    );

    it('can create en encrypted request', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const ret = await requestLogic.createEncryptedRequest(
        createParams,
        TestData.payeeRaw.identity,
        [TestData.payeeRaw.encryptionParams, TestData.payerRaw.encryptionParams],
      );

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
          result: {
            requestId: '010246b8aeb3aa72f4c7039284bf7307c3d543541ff309ee52e9361f4bd2c89c9c',
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(action),
        requestId,
        [TestData.payeeRaw.encryptionParams, TestData.payerRaw.encryptionParams],
      );
    });

    it('can create en encrypted request with topics', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const ret = await requestLogic.createEncryptedRequest(
        createParams,
        TestData.payeeRaw.identity,
        [TestData.payeeRaw.encryptionParams, TestData.payerRaw.encryptionParams],
        [TestData.payeeRaw.identity, TestData.payerRaw.identity],
      );
      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(action),
        requestId,
        [TestData.payeeRaw.encryptionParams, TestData.payerRaw.encryptionParams],
        [
          MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(TestData.payeeRaw.identity)),
          MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(TestData.payerRaw.identity)),
        ],
      );
    });

    it(
      'cannot create en encrypted request without encryption parameteres',
      async () => {
        const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);

        await expect(
          requestLogic.createEncryptedRequest(createParams, TestData.payeeRaw.identity, []),
        ).to.eventually.be.rejectedWith(
          'You must give at least one encryption parameter to create an encrypted request',
        );
      }
    );

    it('can createEncryptedRequest if persist emit error', async () => {
      const clock = sinon.useFakeTimers();
      const fakeTransactionManagerEmittingError = Object.assign({}, fakeTransactionManager);
      fakeTransactionManagerEmittingError.persistTransaction = chai.spy(
        (): any => {
          const fakeTransactionManagerWithEvent = Object.assign(
            new EventEmitter(),
            fakeMetaTransactionManager,
          );
          setTimeout(() => {
            // tslint:disable-next-line:no-magic-numbers
            fakeTransactionManagerWithEvent.emit('error', 'error for test purpose', 10);
          });
          return fakeTransactionManagerWithEvent;
        },
      );

      const requestLogic = new RequestLogic(
        fakeTransactionManagerEmittingError,
        TestData.fakeSignatureProvider,
      );
      const ret = await requestLogic.createEncryptedRequest(
        createParams,
        TestData.payeeRaw.identity,
        [TestData.payeeRaw.encryptionParams, TestData.payerRaw.encryptionParams],
      );

      // tslint:disable-next-line:typedef
      const handleError = chai.spy((error: any) => {
        expect(error, 'error wrong').to.deep.equal('error for test purpose');
      });
      ret.on('error', handleError);

      clock.tick(11);

      expect(handleError, 'error must be emitted').to.have.called();

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({ requestId });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      expect(fakeTransactionManagerEmittingError.persistTransaction).to.have.been.called.with(
        JSON.stringify(action),
        requestId,
      );
      sinon.restore();
    });
  });

  describe('computeRequestId', () => {
    it('cannot computeRequestId without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);

      await expect(
        requestLogic.computeRequestId(createParams, TestData.payeeRaw.identity),
      ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
    });

    it(
      'cannot compute request id if apply fails in the advanced request logic',
      async () => {
        const fakeAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
          applyActionToExtensions: (): RequestLogicTypes.IExtensionStates => {
            throw new Error('Expected throw');
          },
          extensions: {},
        };

        const requestLogic = new RequestLogic(
          fakeTransactionManager,
          TestData.fakeSignatureProvider,
          fakeAdvancedLogic,
        );

        const createParamsWithExtensions: RequestLogicTypes.ICreateParameters = {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: TestData.arbitraryExpectedAmount,
          extensionsData: ['whatever'],
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544426030,
        };

        await expect(
          requestLogic.computeRequestId(createParamsWithExtensions, TestData.payeeRaw.identity),
        ).to.eventually.be.rejectedWith('Expected throw');
      }
    );

    it('can computeRequestId', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const generatedRequestId = await requestLogic.computeRequestId(
        createParams,
        TestData.payeeRaw.identity,
      );

      expect(generatedRequestId).to.equal(requestId);

      expect(fakeTransactionManager.persistTransaction).to.not.have.been.called();
    });
  });

  describe('acceptRequest', () => {
    it('can acceptRequest', async () => {
      const acceptParams = {
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const ret = await requestLogic.acceptRequest(acceptParams, TestData.payerRaw.identity);

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      const data = {
        name: RequestLogicTypes.ACTION_NAME.ACCEPT,
        parameters: acceptParams,
        version: CURRENT_VERSION,
      };
      const actionExpected = TestData.fakeSignatureProvider.sign(data, TestData.payerRaw.identity);

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(actionExpected),
        requestId,
      );
    });
    it('cannot acceptRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const acceptParams = {
        requestId,
      };

      await expect(
        requestLogic.acceptRequest(acceptParams, TestData.payeeRaw.identity),
      ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
    });

    it('cannot accept as payee', async () => {
      const actionCreate = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );
      const transactionManager: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: chai.spy.returns(
          Promise.resolve({
            meta: { ignoredTransactions: [] },
            result: {
              transactions: [
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 1,
                  transaction: { data: JSON.stringify(actionCreate) },
                },
              ],
            },
          }),
        ),
        persistTransaction: chai.spy() as any,
      };
      const acceptParams = {
        requestId,
      };
      const requestLogic = new RequestLogic(transactionManager, TestData.fakeSignatureProvider);

      await expect(
        requestLogic.acceptRequest(acceptParams, TestData.payeeRaw.identity, true),
      ).to.eventually.be.rejectedWith('Signer must be the payer');
    });
  });

  describe('cancelRequest', () => {
    it('can cancelRequest', async () => {
      const cancelRequest = {
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);
      const ret = await requestLogic.cancelRequest(cancelRequest, TestData.payeeRaw.identity);

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      const data = {
        name: RequestLogicTypes.ACTION_NAME.CANCEL,
        parameters: cancelRequest,
        version: CURRENT_VERSION,
      };
      const actionExpected = TestData.fakeSignatureProvider.sign(data, TestData.payeeRaw.identity);

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(actionExpected),
        requestId,
      );
    });
    it('cannot cancelRequest without signature provider', async () => {
      const requestLogic = new RequestLogic(fakeTransactionManager);
      const cancelParams = {
        requestId,
      };

      await expect(
        requestLogic.cancelRequest(cancelParams, TestData.payeeRaw.identity),
      ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
    });

    it('cannot cancel if not payee or payer', async () => {
      const actionCreate = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );
      const transactionManager: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: chai.spy.returns(
          Promise.resolve({
            meta: { ignoredTransactions: [] },
            result: {
              transactions: [
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 1,
                  transaction: { data: JSON.stringify(actionCreate) },
                },
              ],
            },
          }),
        ),
        persistTransaction: chai.spy() as any,
      };
      const cancelParams = {
        requestId,
      };
      const requestLogic = new RequestLogic(transactionManager, TestData.fakeSignatureProvider);

      await expect(
        requestLogic.cancelRequest(cancelParams, TestData.otherIdRaw.identity, true),
      ).to.eventually.be.rejectedWith('Signer must be the payer or the payee');
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('can increaseExpectedAmountRequest', async () => {
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);

      const ret = await requestLogic.increaseExpectedAmountRequest(
        increaseRequest,
        TestData.payerRaw.identity,
      );

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      const data = {
        name: RequestLogicTypes.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
        parameters: increaseRequest,
        version: CURRENT_VERSION,
      };
      const actionExpected = TestData.fakeSignatureProvider.sign(data, TestData.payerRaw.identity);

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(actionExpected),
        requestId,
      );
    });
    it(
      'cannot increaseExpectedAmountRequest without signature provider',
      async () => {
        const requestLogic = new RequestLogic(fakeTransactionManager);
        const increaseRequest = {
          deltaAmount: '1000',
          requestId,
        };

        await expect(
          requestLogic.increaseExpectedAmountRequest(increaseRequest, TestData.payerRaw.identity),
        ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
      }
    );
    it('cannot increaseExpectedAmountRequest as payee', async () => {
      const actionCreate = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );
      const transactionManager: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: chai.spy.returns(
          Promise.resolve({
            meta: { ignoredTransactions: [] },
            result: {
              transactions: [
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 1,
                  transaction: { data: JSON.stringify(actionCreate) },
                },
              ],
            },
          }),
        ),
        persistTransaction: chai.spy() as any,
      };
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(transactionManager, TestData.fakeSignatureProvider);

      await expect(
        requestLogic.increaseExpectedAmountRequest(
          increaseRequest,
          TestData.payeeRaw.identity,
          true,
        ),
      ).to.eventually.be.rejectedWith('signer must be the payer');
    });
  });

  describe('reduceExpectedAmountRequest', () => {
    it('can reduceExpectedAmountRequest', async () => {
      const reduceRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);

      const ret = await requestLogic.reduceExpectedAmountRequest(
        reduceRequest,
        TestData.payeeRaw.identity,
      );

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      const data = {
        name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
        parameters: reduceRequest,
        version: CURRENT_VERSION,
      };
      const actionExpected = TestData.fakeSignatureProvider.sign(data, TestData.payeeRaw.identity);

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(actionExpected),
        requestId,
      );
    });
    it(
      'cannot reduceExpectedAmountRequest without signature provider',
      async () => {
        const requestLogic = new RequestLogic(fakeTransactionManager);
        const reduceRequest = {
          deltaAmount: '1000',
          requestId,
        };

        await expect(
          requestLogic.reduceExpectedAmountRequest(reduceRequest, TestData.payeeRaw.identity),
        ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
      }
    );
    it('cannot reduceExpectedAmountRequest as payer', async () => {
      const actionCreate = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );
      const transactionManager: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: chai.spy.returns(
          Promise.resolve({
            meta: { ignoredTransactions: [] },
            result: {
              transactions: [
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 1,
                  transaction: { data: JSON.stringify(actionCreate) },
                },
              ],
            },
          }),
        ),
        persistTransaction: chai.spy() as any,
      };
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(transactionManager, TestData.fakeSignatureProvider);

      await expect(
        requestLogic.reduceExpectedAmountRequest(increaseRequest, TestData.payerRaw.identity, true),
      ).to.eventually.be.rejectedWith('signer must be the payee');
    });
  });

  describe('addExtensionsDataRequest', () => {
    it('can addExtensionsDataRequest', async () => {
      const addExtRequest = {
        extensionsData: TestData.oneExtension,
        requestId,
      };
      const requestLogic = new RequestLogic(fakeTransactionManager, TestData.fakeSignatureProvider);

      const ret = await requestLogic.addExtensionsDataRequest(
        addExtRequest,
        TestData.payeeRaw.identity,
      );

      ret.on('confirmed', resultConfirmed1 => {
        expect(resultConfirmed1, 'result Confirmed wrong').to.deep.equal({
          meta: {
            transactionManagerMeta: {
              storageDataId: 'fakeDataId',
            },
          },
        });
      });

      expect(ret.result, 'ret.result is wrong').to.be.undefined;
      expect(ret.meta).to.be.deep.equal({
        transactionManagerMeta: fakeMetaTransactionManager.meta,
      });

      const data = {
        name: RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA,
        parameters: addExtRequest,
        version: CURRENT_VERSION,
      };
      const actionExpected = TestData.fakeSignatureProvider.sign(data, TestData.payeeRaw.identity);

      expect(fakeTransactionManager.persistTransaction).to.have.been.called.with(
        JSON.stringify(actionExpected),
        requestId,
      );
    });
    it(
      'cannot addExtensionsDataRequest without signature provider',
      async () => {
        const requestLogic = new RequestLogic(fakeTransactionManager);
        const addExtRequest = {
          extensionsData: TestData.oneExtension,
          requestId,
        };

        await expect(
          requestLogic.addExtensionsDataRequest(addExtRequest, TestData.payeeRaw.identity),
        ).to.eventually.be.rejectedWith('You must give a signature provider to create actions');
      }
    );
    it(
      'cannot addExtension if apply fail in the advanced request logic',
      async () => {
        const fakeAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
          applyActionToExtensions: (): RequestLogicTypes.IExtensionStates => {
            throw new Error('Expected throw');
          },
          extensions: {},
        };

        const actionCreate = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: {
                type: RequestLogicTypes.CURRENCY.ETH,
                value: 'ETH',
              },
              expectedAmount: '123400000000000000',
              payee: TestData.payeeRaw.identity,
              payer: TestData.payerRaw.identity,
              timestamp: 1544426030,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );
        const transactionManager: TransactionTypes.ITransactionManager = {
          getChannelsByMultipleTopics: chai.spy() as any,
          getChannelsByTopic: chai.spy() as any,
          getTransactionsByChannelId: chai.spy.returns(
            Promise.resolve({
              meta: { ignoredTransactions: [] },
              result: {
                transactions: [
                  {
                    state: TransactionTypes.TransactionState.CONFIRMED,
                    timestamp: 1,
                    transaction: { data: JSON.stringify(actionCreate) },
                  },
                ],
              },
            }),
          ),
          persistTransaction: chai.spy() as any,
        };
        const addExtensionParams = {
          extensionsData: ['whatever'],
          requestId,
        };
        const requestLogic = new RequestLogic(
          transactionManager,
          TestData.fakeSignatureProvider,
          fakeAdvancedLogic,
        );

        await expect(
          requestLogic.addExtensionsDataRequest(addExtensionParams, TestData.payeeRaw.identity, true),
        ).to.eventually.be.rejectedWith('Expected throw');
      }
    );
  });

  describe('getRequestFromId', () => {
    it('can getRequestFromId', async () => {
      const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const meta = { ignoredTransactions: [] };
      const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
        meta,
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 1,
              transaction: { data: JSON.stringify(actionCreate) },
            },
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 2,
              transaction: { data: JSON.stringify(actionAccept) },
            },
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 3,
              transaction: { data: JSON.stringify(rxReduce) },
            },
          ],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
          listActions,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const request = await requestLogic.getRequestFromId(requestId);

      expect(request, 'request result is wrong').to.deep.equal({
        meta: {
          ignoredTransactions: [],
          transactionManagerMeta: meta,
        },
        result: {
          pending: null,
          request: {
            creator: TestData.payeeRaw.identity,
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            events: [
              {
                actionSigner: TestData.payeeRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.CREATE,
                parameters: {
                  expectedAmount: '123400000000000000',
                  extensionsDataLength: 0,
                  isSignedRequest: false,
                },
                timestamp: 1,
              },
              {
                actionSigner: TestData.payerRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.ACCEPT,
                parameters: {
                  extensionsDataLength: 0,
                },
                timestamp: 2,
              },
              {
                actionSigner: TestData.payeeRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
                parameters: {
                  deltaAmount: '1000',
                  extensionsDataLength: 0,
                },
                timestamp: 3,
              },
            ],
            expectedAmount: '123399999999999000',
            extensions: {},
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            requestId,
            state: RequestLogicTypes.STATE.ACCEPTED,
            timestamp: 1544426030,
            version: CURRENT_VERSION,
          },
        },
      });
    });

    it('can getRequestFromId ignore old pending transaction', async () => {
      const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const meta = { ignoredTransactions: [] };
      const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
        meta,
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 1,
              transaction: { data: JSON.stringify(actionCreate) },
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: { data: JSON.stringify(actionAccept) },
            },
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 3,
              transaction: { data: JSON.stringify(rxReduce) },
            },
          ],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
          listActions,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const request = await requestLogic.getRequestFromId(requestId);

      expect(request, 'request result is wrong').to.deep.equal({
        meta: {
          ignoredTransactions: [
            {
              reason: 'Confirmed transaction newer than this pending transaction',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: {
                  data:
                    '{"data":{"name":"accept","parameters":{"requestId":"010246b8aeb3aa72f4c7039284bf7307c3d543541ff309ee52e9361f4bd2c89c9c"},"version":"2.0.3"},"signature":{"method":"ecdsa","value":"0xe53448080b32927c66827f3d946e988f18cfa4dfa640e15563eb4c266ab65e3932df94fdab3e3625da4f41b8ce8ef56c3ae39d89189859c3d3090ca4503247141b"}}',
                },
              },
            },
          ],
          transactionManagerMeta: meta,
        },
        result: {
          pending: null,
          request: {
            creator: TestData.payeeRaw.identity,
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            events: [
              {
                actionSigner: TestData.payeeRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.CREATE,
                parameters: {
                  expectedAmount: '123400000000000000',
                  extensionsDataLength: 0,
                  isSignedRequest: false,
                },
                timestamp: 1,
              },
              {
                actionSigner: TestData.payeeRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
                parameters: {
                  deltaAmount: '1000',
                  extensionsDataLength: 0,
                },
                timestamp: 3,
              },
            ],
            expectedAmount: '123399999999999000',
            extensions: {},
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            requestId,
            state: RequestLogicTypes.STATE.CREATED,
            timestamp: 1544426030,
            version: CURRENT_VERSION,
          },
        },
      });
    });

    it('can getRequestFromId with pending transaction', async () => {
      const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const meta = { ignoredTransactions: [] };
      const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
        meta,
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 1,
              transaction: { data: JSON.stringify(actionCreate) },
            },
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 2,
              transaction: { data: JSON.stringify(actionAccept) },
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 3,
              transaction: { data: JSON.stringify(rxReduce) },
            },
          ],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
          listActions,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );
      const request = await requestLogic.getRequestFromId(requestId);

      expect(request, 'request result is wrong').to.deep.equal({
        meta: {
          ignoredTransactions: [],
          transactionManagerMeta: meta,
        },
        result: {
          pending: {
            events: [
              {
                actionSigner: TestData.payeeRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
                parameters: {
                  deltaAmount: '1000',
                  extensionsDataLength: 0,
                },
                timestamp: 3,
              },
            ],
            expectedAmount: '123399999999999000',
          },
          request: {
            creator: TestData.payeeRaw.identity,
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            events: [
              {
                actionSigner: TestData.payeeRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.CREATE,
                parameters: {
                  expectedAmount: '123400000000000000',
                  extensionsDataLength: 0,
                  isSignedRequest: false,
                },
                timestamp: 1,
              },
              {
                actionSigner: TestData.payerRaw.identity,
                name: RequestLogicTypes.ACTION_NAME.ACCEPT,
                parameters: {
                  extensionsDataLength: 0,
                },
                timestamp: 2,
              },
            ],
            expectedAmount: '123400000000000000',
            extensions: {},
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            requestId,
            state: RequestLogicTypes.STATE.ACCEPTED,
            timestamp: 1544426030,
            version: CURRENT_VERSION,
          },
        },
      });
    });

    it(
      'can getRequestFromId ignore the same transactions even with different case',
      async () => {
        const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: {
                type: RequestLogicTypes.CURRENCY.ETH,
                value: 'ETH',
              },
              expectedAmount: '123400000000000000',
              payee: TestData.payeeRaw.identity,
              payer: TestData.payerRaw.identity,
              timestamp: 1544426030,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.ACCEPT,
            parameters: {
              requestId,
            },
            version: CURRENT_VERSION,
          },
          TestData.payerRaw.signatureParams,
        );

        const actionReduce: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              requestId,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const actionReduce2: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              requestId: requestId.toUpperCase(),
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const meta = { ignoredTransactions: [] };
        const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
          meta,
          result: {
            transactions: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 1,
                transaction: { data: JSON.stringify(actionCreate) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionAccept) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 3,
                transaction: { data: JSON.stringify(actionReduce) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 4,
                transaction: { data: JSON.stringify(actionReduce2) },
              },
            ],
          },
        });

        const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
          getChannelsByMultipleTopics: chai.spy() as any,
          getChannelsByTopic: chai.spy() as any,
          getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
            listActions,
          persistTransaction: chai.spy() as any,
        };
        const requestLogic = new RequestLogic(
          fakeTransactionManagerGet,
          TestData.fakeSignatureProvider,
        );

        const request = await requestLogic.getRequestFromId(requestId);

        expect(request, 'request result is wrong').to.deep.equal({
          meta: {
            ignoredTransactions: [
              {
                reason: 'Duplicated transaction',
                transaction: {
                  action: actionReduce2,
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 4,
                },
              },
            ],
            transactionManagerMeta: meta,
          },
          result: {
            pending: null,
            request: {
              creator: TestData.payeeRaw.identity,
              currency: {
                type: RequestLogicTypes.CURRENCY.ETH,
                value: 'ETH',
              },
              events: [
                {
                  actionSigner: TestData.payeeRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.CREATE,
                  parameters: {
                    expectedAmount: '123400000000000000',
                    extensionsDataLength: 0,
                    isSignedRequest: false,
                  },
                  timestamp: 1,
                },
                {
                  actionSigner: TestData.payerRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.ACCEPT,
                  parameters: {
                    extensionsDataLength: 0,
                  },
                  timestamp: 2,
                },
                {
                  actionSigner: TestData.payeeRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
                  parameters: {
                    deltaAmount: '1000',
                    extensionsDataLength: 0,
                  },
                  timestamp: 3,
                },
              ],
              expectedAmount: '123399999999999000',
              extensions: {},
              payee: TestData.payeeRaw.identity,
              payer: TestData.payerRaw.identity,
              requestId,
              state: RequestLogicTypes.STATE.ACCEPTED,
              timestamp: 1544426030,
              version: CURRENT_VERSION,
            },
          },
        });
      }
    );

    it(
      'can getRequestFromId do not ignore the same transactions if different nonces',
      async () => {
        const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: {
                type: RequestLogicTypes.CURRENCY.ETH,
                value: 'ETH',
              },
              expectedAmount: '123400000000000000',
              payee: TestData.payeeRaw.identity,
              payer: TestData.payerRaw.identity,
              timestamp: 1544426030,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.ACCEPT,
            parameters: {
              requestId,
            },
            version: CURRENT_VERSION,
          },
          TestData.payerRaw.signatureParams,
        );

        const actionReduce: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              requestId,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const actionReduce2: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              nonce: 1,
              requestId: requestId.toUpperCase(),
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const meta = { ignoredTransactions: [] };
        const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
          meta,
          result: {
            transactions: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 1,
                transaction: { data: JSON.stringify(actionCreate) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionAccept) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 3,
                transaction: { data: JSON.stringify(actionReduce) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 4,
                transaction: { data: JSON.stringify(actionReduce2) },
              },
            ],
          },
        });

        const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
          getChannelsByMultipleTopics: chai.spy() as any,
          getChannelsByTopic: chai.spy() as any,
          getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
            listActions,
          persistTransaction: chai.spy() as any,
        };
        const requestLogic = new RequestLogic(
          fakeTransactionManagerGet,
          TestData.fakeSignatureProvider,
        );

        const request = await requestLogic.getRequestFromId(requestId);

        expect(request, 'request result is wrong').to.deep.equal({
          meta: {
            ignoredTransactions: [],
            transactionManagerMeta: meta,
          },
          result: {
            pending: null,
            request: {
              creator: TestData.payeeRaw.identity,
              currency: {
                type: RequestLogicTypes.CURRENCY.ETH,
                value: 'ETH',
              },
              events: [
                {
                  actionSigner: TestData.payeeRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.CREATE,
                  parameters: {
                    expectedAmount: '123400000000000000',
                    extensionsDataLength: 0,
                    isSignedRequest: false,
                  },
                  timestamp: 1,
                },
                {
                  actionSigner: TestData.payerRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.ACCEPT,
                  parameters: {
                    extensionsDataLength: 0,
                  },
                  timestamp: 2,
                },
                {
                  actionSigner: TestData.payeeRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
                  parameters: {
                    deltaAmount: '1000',
                    extensionsDataLength: 0,
                  },
                  timestamp: 3,
                },
                {
                  actionSigner: TestData.payeeRaw.identity,
                  name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
                  parameters: {
                    deltaAmount: '1000',
                    extensionsDataLength: 0,
                  },
                  timestamp: 4,
                },
              ],
              expectedAmount: '123399999999998000',
              extensions: {},
              payee: TestData.payeeRaw.identity,
              payer: TestData.payerRaw.identity,
              requestId,
              state: RequestLogicTypes.STATE.ACCEPTED,
              timestamp: 1544426030,
              version: CURRENT_VERSION,
            },
          },
        });
      }
    );

    it('should ignored the corrupted data (not parsable JSON)', async () => {
      const transactionNotParsable = {
        state: TransactionTypes.TransactionState.CONFIRMED,
        timestamp: 2,
        transaction: { data: '{NOT parsable}' },
      };
      const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
        meta: { ignoredTransactions: [] },
        result: {
          transactions: [transactionNotParsable],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
          listActions,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const request = await requestLogic.getRequestFromId(requestId);
      expect(
        request.meta.ignoredTransactions && request.meta.ignoredTransactions.length,
      ).to.be.equal(1);
      expect(
        request.meta.ignoredTransactions && request.meta.ignoredTransactions[0],
      ).to.be.deep.equal({
        reason: 'JSON parsing error',
        transaction: transactionNotParsable,
      });
      expect(request.result.request, 'request should be null').to.be.null;
    });

    it('should ignored the corrupted data (e.g: wrong properties)', async () => {
      const actionCorrupted: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CREATE,
          parameters: {
            currency: {
              type: RequestLogicTypes.CURRENCY.ETH,
              value: 'ETH',
            },
            expectedAmount: 'NOT A NUMBER',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
            timestamp: 1544426030,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const listActions: Promise<TransactionTypes.IReturnGetTransactions> = Promise.resolve({
        meta: { ignoredTransactions: [] },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.CONFIRMED,
              timestamp: 2,
              transaction: { data: JSON.stringify(actionCorrupted) },
            },
          ],
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: (): Promise<TransactionTypes.IReturnGetTransactions> =>
          listActions,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const request = await requestLogic.getRequestFromId(requestId);

      expect(
        request.meta.ignoredTransactions && request.meta.ignoredTransactions.length,
      ).to.be.equal(1);
      expect(
        request.meta.ignoredTransactions && request.meta.ignoredTransactions[0],
      ).to.be.deep.equal({
        reason: 'action.parameters.expectedAmount must be a string representing a positive integer',
        transaction: {
          action: actionCorrupted,
          state: TransactionTypes.TransactionState.CONFIRMED,
          timestamp: 2,
        },
      });
      expect(request.result.request, 'request should be null').to.be.null;
    });
  });

  describe('getRequestsByTopic', () => {
    it('can getRequestsByTopic', async () => {
      const unsignedActionCreation = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: '123400000000000000',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544426030,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation),
      );

      const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId: newRequestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId: newRequestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const unsignedActionCreation2 = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          expectedAmount: '10',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544411111,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate2: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation2,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId2 = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation2),
      );

      const actionCancel2: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: {
            requestId: newRequestId2,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const unsignedActionCreation3 = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          expectedAmount: '666',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544433333,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate3: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation3,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId3 = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation3),
      );

      const meta = {
        dataAccessMeta: { [requestId]: [], [newRequestId2]: [], [newRequestId3]: [] },
        ignoredTransactions: {},
      };
      const listAllActions: Promise<
        TransactionTypes.IReturnGetTransactionsByChannels
      > = Promise.resolve({
        meta,
        result: {
          transactions: {
            [requestId]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 0,
                transaction: { data: JSON.stringify(actionCreate) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionAccept) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 3,
                transaction: { data: JSON.stringify(rxReduce) },
              },
            ],
            [newRequestId2]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 1,
                transaction: { data: JSON.stringify(actionCreate2) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionCancel2) },
              },
            ],
            [newRequestId3]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 4,
                transaction: { data: JSON.stringify(actionCreate3) },
              },
            ],
          },
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: (): Promise<TransactionTypes.IReturnGetTransactionsByChannels> => {
          return listAllActions;
        },
        getTransactionsByChannelId: chai.spy() as any,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const requests = await requestLogic.getRequestsByTopic('fakeTopicForAll');

      expect(requests.result.requests.length, 'requests result is wrong').to.equal(3);
    });

    it('can getRequestsByTopic with pending transactions', async () => {
      const unsignedActionCreation = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: '123400000000000000',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544426030,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation),
      );

      const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId: newRequestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId: newRequestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const unsignedActionCreation2 = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          expectedAmount: '10',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544411111,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate2: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation2,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId2 = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation2),
      );

      const actionCancel2: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: {
            requestId: newRequestId2,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const unsignedActionCreation3 = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          expectedAmount: '666',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544433333,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate3: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation3,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId3 = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation3),
      );

      const meta = {
        dataAccessMeta: { [requestId]: [], [newRequestId2]: [], [newRequestId3]: [] },
        ignoredTransactions: {},
      };
      const listAllActions: Promise<
        TransactionTypes.IReturnGetTransactionsByChannels
      > = Promise.resolve({
        meta,
        result: {
          transactions: {
            [requestId]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 0,
                transaction: { data: JSON.stringify(actionCreate) },
              },
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionAccept) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 3,
                transaction: { data: JSON.stringify(rxReduce) },
              },
            ],
            [newRequestId2]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 1,
                transaction: { data: JSON.stringify(actionCreate2) },
              },
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionCancel2) },
              },
            ],
            [newRequestId3]: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 4,
                transaction: { data: JSON.stringify(actionCreate3) },
              },
            ],
          },
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: chai.spy() as any,
        getChannelsByTopic: (): Promise<TransactionTypes.IReturnGetTransactionsByChannels> => {
          return listAllActions;
        },
        getTransactionsByChannelId: chai.spy() as any,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const requests = await requestLogic.getRequestsByTopic('fakeTopicForAll');

      expect(requests.result.requests.length, 'requests result is wrong').to.equal(3);

      const firstRequest = requests.result.requests[0];
      expect(firstRequest.pending, 'first pending wrong').to.be.null;
      expect(
        firstRequest.request!.expectedAmount,
        'first request expectedAmount wrong',
      ).to.deep.equal('123399999999999000');
      expect(firstRequest.request!.state, 'first request state wrong').to.deep.equal(
        RequestLogicTypes.STATE.CREATED,
      );

      const secondRequest = requests.result.requests[1];
      expect(secondRequest.request!.state, 'second pending wrong').to.deep.equal(
        RequestLogicTypes.STATE.CREATED,
      );
      expect(secondRequest.pending!.state, 'second pending wrong').to.deep.equal(
        RequestLogicTypes.STATE.CANCELED,
      );

      const thirdRequest = requests.result.requests[2];
      expect(thirdRequest.request, 'third pending wrong').to.be.null;
      expect(thirdRequest.pending!.state, 'third pending wrong').to.deep.equal(
        RequestLogicTypes.STATE.CREATED,
      );
    });

    it(
      'should ignore the transaction none parsable and the rejected action',
      async () => {
        const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.CREATE,
            parameters: {
              currency: {
                type: RequestLogicTypes.CURRENCY.ETH,
                value: 'ETH',
              },
              expectedAmount: '123400000000000000',
              payee: TestData.payeeRaw.identity,
              payer: TestData.payerRaw.identity,
              timestamp: 1544426030,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const acceptNotValid: RequestLogicTypes.IAction = Utils.signature.sign(
          {
            name: RequestLogicTypes.ACTION_NAME.ACCEPT,
            parameters: {
              requestId,
            },
            version: CURRENT_VERSION,
          },
          TestData.payeeRaw.signatureParams,
        );

        const meta = {
          dataAccessMeta: { [requestId]: [] },
          ignoredTransactions: {},
        };
        const listActions: Promise<
          TransactionTypes.IReturnGetTransactionsByChannels
        > = Promise.resolve({
          meta,
          result: {
            transactions: {
              [requestId]: [
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 2,
                  transaction: { data: JSON.stringify(actionCreate) },
                },
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 2,
                  transaction: { data: 'Not a json' },
                },
                {
                  state: TransactionTypes.TransactionState.CONFIRMED,
                  timestamp: 2,
                  transaction: { data: JSON.stringify(acceptNotValid) },
                },
              ],
            },
          },
        });

        const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
          getChannelsByMultipleTopics: chai.spy() as any,
          getChannelsByTopic: (): Promise<TransactionTypes.IReturnGetTransactionsByChannels> => {
            return listActions;
          },
          getTransactionsByChannelId: chai.spy() as any,
          persistTransaction: chai.spy() as any,
        };
        const requestLogic = new RequestLogic(
          fakeTransactionManagerGet,
          TestData.fakeSignatureProvider,
        );

        const requests = await requestLogic.getRequestsByTopic('fakeTopicForAll');

        expect(requests.result.requests.length, 'requests result is wrong').to.equal(1);
      }
    );
  });

  describe('getRequestsByMultipleTopic', () => {
    it('can getRequestsByMultipleTopic', async () => {
      const unsignedActionCreation = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          },
          expectedAmount: '123400000000000000',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544426030,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation),
      );

      const actionAccept: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.ACCEPT,
          parameters: {
            requestId: newRequestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const rxReduce: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId: newRequestId,
          },
          version: CURRENT_VERSION,
        },
        TestData.payeeRaw.signatureParams,
      );

      const unsignedActionCreation2 = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          expectedAmount: '10',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544411111,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate2: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation2,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId2 = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation2),
      );

      const actionCancel2: RequestLogicTypes.IAction = Utils.signature.sign(
        {
          name: RequestLogicTypes.ACTION_NAME.CANCEL,
          parameters: {
            requestId: newRequestId2,
          },
          version: CURRENT_VERSION,
        },
        TestData.payerRaw.signatureParams,
      );

      const unsignedActionCreation3 = {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          currency: {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          expectedAmount: '666',
          payee: TestData.payeeRaw.identity,
          payer: TestData.payerRaw.identity,
          timestamp: 1544433333,
        },
        version: CURRENT_VERSION,
      };
      const actionCreate3: RequestLogicTypes.IAction = Utils.signature.sign(
        unsignedActionCreation3,
        TestData.payeeRaw.signatureParams,
      );
      const newRequestId3 = MultiFormat.serialize(
        Utils.crypto.normalizeKeccak256Hash(unsignedActionCreation3),
      );

      const meta = {
        dataAccessMeta: { [requestId]: [], [newRequestId2]: [], [newRequestId3]: [] },
        ignoredTransactions: {},
      };
      const listAllActions: Promise<
        TransactionTypes.IReturnGetTransactionsByChannels
      > = Promise.resolve({
        meta,
        result: {
          transactions: {
            [requestId]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 0,
                transaction: { data: JSON.stringify(actionCreate) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionAccept) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 3,
                transaction: { data: JSON.stringify(rxReduce) },
              },
            ],
            [newRequestId2]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 1,
                transaction: { data: JSON.stringify(actionCreate2) },
              },
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 2,
                transaction: { data: JSON.stringify(actionCancel2) },
              },
            ],
            [newRequestId3]: [
              {
                state: TransactionTypes.TransactionState.CONFIRMED,
                timestamp: 4,
                transaction: { data: JSON.stringify(actionCreate3) },
              },
            ],
          },
        },
      });

      const fakeTransactionManagerGet: TransactionTypes.ITransactionManager = {
        getChannelsByMultipleTopics: (): Promise<
          TransactionTypes.IReturnGetTransactionsByChannels
        > => {
          return listAllActions;
        },
        getChannelsByTopic: chai.spy() as any,
        getTransactionsByChannelId: chai.spy() as any,
        persistTransaction: chai.spy() as any,
      };
      const requestLogic = new RequestLogic(
        fakeTransactionManagerGet,
        TestData.fakeSignatureProvider,
      );

      const requests = await requestLogic.getRequestsByMultipleTopics(['fakeTopicForAll']);

      expect(requests.result.requests.length, 'requests result is wrong').to.equal(3);
    });
  });
});
