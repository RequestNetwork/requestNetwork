import 'mocha';

import MultiFormat from '@requestnetwork/multi-format';
import Utils from '@requestnetwork/utils';

const chai = require('chai');
const spies = require('chai-spies');
const chaiAsPromised = require('chai-as-promised');

chai.use(spies);
chai.use(chaiAsPromised);

const expect = chai.expect;

import { DataAccessTypes, EncryptionTypes } from '@requestnetwork/types';

import { TransactionManager } from '../src/index';
import TransactionsFactory from '../src/transactions-factory';

import * as TestData from './unit/utils/test-data';

const extraTopics = ['topic1', 'topic2'];
const fakeTxHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
const data2 = '{"or": "can", "be":false}';

const tx: DataAccessTypes.IConfirmedTransaction = { transaction: { data }, timestamp: 1 };
const tx2: DataAccessTypes.IConfirmedTransaction = { transaction: { data: data2 }, timestamp: 1 };

const dataHash = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data));
const channelId = MultiFormat.serialize(dataHash);
const dataHash2 = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data2));
const channelId2 = MultiFormat.serialize(dataHash2);

const fakeMetaDataAccessPersistReturn: DataAccessTypes.IReturnPersistTransaction = {
  meta: { transactionStorageLocation: 'fakeDataId', topics: extraTopics },
  result: { topics: [fakeTxHash] },
};

const fakeMetaDataAccessGetReturn: DataAccessTypes.IReturnGetTransactions = {
  meta: { transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'] },
  result: { transactions: [tx, tx2] },
};

const fakeMetaDataAccessGetChannelsReturn: DataAccessTypes.IReturnGetChannelsByTopic = {
  meta: { transactionsStorageLocation: { [channelId]: ['fakeDataId1', 'fakeDataId2'] } },
  result: { transactions: { [channelId]: [tx, tx2] } },
};
let fakeDataAccess: DataAccessTypes.IDataAccess;

/* tslint:disable:no-unused-expression */
describe('index', () => {
  beforeEach(() => {
    fakeDataAccess = {
      getChannelsByMultipleTopics: chai.spy.returns(fakeMetaDataAccessGetChannelsReturn),
      getChannelsByTopic: chai.spy.returns(fakeMetaDataAccessGetChannelsReturn),
      getTransactionsByChannelId: chai.spy.returns(fakeMetaDataAccessGetReturn),
      initialize: chai.spy(),
      persistTransaction: chai.spy.returns(fakeMetaDataAccessPersistReturn),
    };
  });
  describe('persistTransaction', () => {
    describe('in a new channel', () => {
      it('can persist a clear transaction in a new channel', async () => {
        const transactionManager = new TransactionManager(fakeDataAccess);

        const ret = await transactionManager.persistTransaction(data, channelId, extraTopics);

        expect(ret.result, 'ret.result is wrong').to.be.deep.equal({});
        expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: undefined,
        });
        expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
          await TransactionsFactory.createClearTransaction(data),
          extraTopics.concat([channelId]),
        );
      });

      it('can persist an encrypted transaction in a new channel', async () => {
        const transactionManager = new TransactionManager(fakeDataAccess);

        const ret = await transactionManager.persistTransaction(data, channelId, extraTopics, [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
          TestData.idRaw3.encryptionParams,
        ]);

        expect(ret.result, 'ret.result is wrong').to.be.deep.equal({});
        expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: 'ecies-aes256-cbc',
        });
        expect(fakeDataAccess.persistTransaction).to.have.been.called.once();
      });
    });

    describe('in an existing new channel', () => {
      it('can persist a clear transaction in an existing channel', async () => {
        const transactionManager = new TransactionManager(fakeDataAccess);

        const ret = await transactionManager.persistTransaction(data2, channelId, extraTopics);

        expect(ret.result, 'ret.result is wrong').to.be.deep.equal({});
        expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: undefined,
        });
        expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
          await TransactionsFactory.createClearTransaction(data2),
          channelId,
          extraTopics.concat([channelId2]),
        );
      });

      it('can persist a encrypted transaction in an existing channel', async () => {
        const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
          TestData.idRaw1.encryptionParams,
        ]);

        const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
          meta: {
            transactionsStorageLocation: ['fakeDataId1'],
          },
          result: {
            transactions: [{ transaction: encryptedTx, timestamp: 1 }],
          },
        };

        fakeDataAccess = {
          getChannelsByMultipleTopics: chai.spy(),
          getChannelsByTopic: chai.spy(),
          getTransactionsByChannelId: chai.spy.returns(
            fakeMetaDataAccessGetReturnWithEncryptedTransaction,
          ),
          initialize: chai.spy(),
          persistTransaction: chai.spy.returns(fakeMetaDataAccessPersistReturn),
        };

        const transactionManager = new TransactionManager(
          fakeDataAccess,
          TestData.fakeDecryptionProvider,
        );
        const ret = await transactionManager.persistTransaction(data2, channelId, extraTopics);

        expect(ret.result, 'ret.result is wrong').to.be.deep.equal({});
        expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: 'ecies-aes256-cbc',
        });

        expect(fakeDataAccess.persistTransaction).to.have.been.called.to.have.been.called.with(
          channelId,
          extraTopics.concat([channelId2]),
        );
      });

      it('cannot persist a encrypted transaction on a channel not found', async () => {
        const fakeMetaDataAccessGetReturnEmpty: DataAccessTypes.IReturnGetTransactions = {
          meta: {
            transactionsStorageLocation: [],
          },
          result: {
            transactions: [],
          },
        };

        fakeDataAccess = {
          getChannelsByMultipleTopics: chai.spy(),
          getChannelsByTopic: chai.spy(),
          getTransactionsByChannelId: chai.spy.returns(fakeMetaDataAccessGetReturnEmpty),
          initialize: chai.spy(),
          persistTransaction: chai.spy.returns(fakeMetaDataAccessPersistReturn),
        };

        const transactionManager = new TransactionManager(
          fakeDataAccess,
          TestData.fakeDecryptionProvider,
        );
        await expect(
          transactionManager.persistTransaction(data2, channelId, extraTopics),
          'must throw',
        ).to.eventually.be.rejectedWith(`Impossible to retrieve the channel: ${channelId}`);
      });

      it('cannot persist a encrypted transaction in an existing channel with encryption parameters given', async () => {
        const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
          TestData.idRaw1.encryptionParams,
        ]);

        const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
          meta: {
            transactionsStorageLocation: ['fakeDataId1'],
          },
          result: {
            transactions: [{ transaction: encryptedTx, timestamp: 1 }],
          },
        };

        fakeDataAccess = {
          getChannelsByMultipleTopics: chai.spy(),
          getChannelsByTopic: chai.spy(),
          getTransactionsByChannelId: chai.spy.returns(
            fakeMetaDataAccessGetReturnWithEncryptedTransaction,
          ),
          initialize: chai.spy(),
          persistTransaction: chai.spy.returns(fakeMetaDataAccessPersistReturn),
        };

        const transactionManager = new TransactionManager(
          fakeDataAccess,
          TestData.fakeDecryptionProvider,
        );
        await expect(
          transactionManager.persistTransaction(data2, channelId, extraTopics, [
            TestData.idRaw1.encryptionParams,
          ]),
          'must throw',
        ).to.eventually.be.rejectedWith('Impossible to add new stakeholder to an existing channel');
      });
    });
  });

  describe('getTransactionsByChannelId', () => {
    it('can get transactions by channel id', async () => {
      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal(
        fakeMetaDataAccessGetReturn.result,
      );
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturn.meta,
        ignoredTransactions: [null, null],
      });
      expect(fakeDataAccess.getTransactionsByChannelId).to.have.been.called.with(channelId);
    });

    it('can getTransactionsByChannelId() with channelId not matching the first transaction hash', async () => {
      const txWrongHash: DataAccessTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { data: '{"wrong": "hash"}' },
      };

      const fakeMetaDataAccessGetReturnFirstHashWrong: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1', 'fakeDataId1', 'fakeDataId2'] },
        result: { transactions: [txWrongHash, tx, tx2] },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(fakeMetaDataAccessGetReturnFirstHashWrong),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnFirstHashWrong.meta,
        ignoredTransactions: [
          {
            reason: 'as first transaction, the hash of the transaction do not match the channelId',
            transaction: txWrongHash,
          },
          null,
          null,
        ],
      });

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: [null, tx, tx2],
      });
      expect(fakeDataAccess.getTransactionsByChannelId).to.have.been.called.with(channelId);
    });

    it('can getTransactionsByChannelId() the first transaction data not parsable', async () => {
      const txWrongHash: DataAccessTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { data: 'Not parsable' },
      };

      const fakeMetaDataAccessGetReturnFirstHashWrong: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1', 'fakeDataId1', 'fakeDataId2'] },
        result: { transactions: [txWrongHash, tx, tx2] },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(fakeMetaDataAccessGetReturnFirstHashWrong),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnFirstHashWrong.meta,
        ignoredTransactions: [
          {
            reason: 'Impossible to JSON parse the transaction',
            transaction: txWrongHash,
          },
          null,
          null,
        ],
      });

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: [null, tx, tx2],
      });
      expect(fakeDataAccess.getTransactionsByChannelId).to.have.been.called.with(channelId);
    });

    it('can get a transaction from an encrypted channel', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1'] },
        result: { transactions: [{ transaction: encryptedTx, timestamp: 1 }] },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: { transactionsStorageLocation: ['fakeDataId1'] },
          encryptionMethod: 'ecies-aes256-cbc',
          ignoredTransactions: [null],
        },
        result: { transactions: [{ transaction: { data }, timestamp: 1 }] },
      });
    });

    it('cannot get a transaction from an encrypted channel without decryption provider', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1'] },
        result: { transactions: [{ transaction: encryptedTx, timestamp: 1 }] },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: { transactionsStorageLocation: ['fakeDataId1'] },
          ignoredTransactions: [
            {
              reason: 'No decryption provider given',
              transaction: { transaction: encryptedTx, timestamp: 1 },
            },
          ],
        },
        result: { transactions: [null] },
      });
    });

    it('can get two transactions with different encryptions from the same encrypted channel', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
      ]);
      const encryptedTx2 = await TransactionsFactory.createEncryptedTransactionInNewChannel(data2, [
        TestData.idRaw3.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: {
          transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
        },
        result: {
          transactions: [
            { transaction: encryptedTx, timestamp: 1 },
            { transaction: encryptedTx2, timestamp: 2 },
          ],
        },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          encryptionMethod: 'ecies-aes256-cbc',
          ignoredTransactions: [
            null,
            {
              reason:
                'the properties "encryptionMethod" and "keys" have been already given for this channel',
              transaction: { transaction: encryptedTx2, timestamp: 2 },
            },
          ],
        },
        result: {
          transactions: [{ transaction: { data }, timestamp: 1 }, null],
        },
      });
    });

    it('can get two transactions with different encryptions from the same encrypted channel the first has the right hash but wrong data', async () => {
      const encryptedTxFakeHash = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data2,
        [TestData.idRaw3.encryptionParams],
      );
      encryptedTxFakeHash.hash = channelId;

      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: {
          transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
        },
        result: {
          transactions: [
            { transaction: encryptedTxFakeHash, timestamp: 1 },
            { transaction: encryptedTx, timestamp: 2 },
          ],
        },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          encryptionMethod: 'ecies-aes256-cbc',
          ignoredTransactions: [
            {
              reason: 'The given hash does not match the hash of the decrypted data',
              transaction: { transaction: encryptedTxFakeHash, timestamp: 1 },
            },
            null,
          ],
        },
        result: {
          transactions: [null, { transaction: { data }, timestamp: 2 }],
        },
      });
    });

    it('can get two transactions, the first is encrypted but the second is clear (will be ignored)', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: {
          transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
        },
        result: {
          transactions: [
            { transaction: encryptedTx, timestamp: 1 },
            { transaction: { data: data2 }, timestamp: 2 },
          ],
        },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          encryptionMethod: 'ecies-aes256-cbc',
          ignoredTransactions: [
            null,
            {
              reason: `Clear transactions are not allowed in encrypted channel`,
              transaction: { transaction: { data: data2 }, timestamp: 2 },
            },
          ],
        },
        result: {
          transactions: [{ transaction: { data }, timestamp: 1 }, null],
        },
      });
    });

    it('can get two transactions first encrypted but decrypt impossible and second clear', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        {
          key: '0396212fc129c2f78771218b2e93da7a5aac63490a42bb41b97848c39c14fe65cd',
          method: EncryptionTypes.METHOD.ECIES,
        },
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: {
          transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
        },
        result: {
          transactions: [
            { transaction: encryptedTx, timestamp: 1 },
            { transaction: { data: data2 }, timestamp: 2 },
          ],
        },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          ignoredTransactions: [
            {
              reason: 'Impossible to decrypt the channel key from this transaction ()',
              transaction: { transaction: encryptedTx, timestamp: 1 },
            },
            {
              reason:
                'as first transaction, the hash of the transaction do not match the channelId',
              transaction: { transaction: { data: data2 }, timestamp: 2 },
            },
          ],
        },
        result: {
          transactions: [null, null],
        },
      });
    });

    it('can get two transactions first clear and second encrypted', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data2, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: {
          transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
        },
        result: {
          transactions: [
            { transaction: { data }, timestamp: 1 },
            { transaction: encryptedTx, timestamp: 2 },
          ],
        },
      };

      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy(),
        getTransactionsByChannelId: chai.spy.returns(
          fakeMetaDataAccessGetReturnWithEncryptedTransaction,
        ),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      expect(ret, 'return is wrong').to.be.deep.equal({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          ignoredTransactions: [
            null,
            {
              reason: 'Encrypted transactions are not allowed in clear channel',
              transaction: { transaction: encryptedTx, timestamp: 2 },
            },
          ],
        },
        result: {
          transactions: [{ transaction: { data }, timestamp: 1 }, null],
        },
      });
    });
  });

  describe('getChannelsByTopic', () => {
    it('can get channels indexed by topics', async () => {
      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal(
        fakeMetaDataAccessGetChannelsReturn.result,
      );
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetChannelsReturn.meta,
        ignoredTransactions: {
          '01a98f126de3fab2b5130af5161998bf6e59b2c380deafeff938ff3f798281bf23': [null, null],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).to.have.been.called.with(extraTopics[0]);
    });

    it('can get an encrypted channel indexed by topic', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);

      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetChannelsByTopic = {
        meta: {
          transactionsStorageLocation: {
            [channelId]: ['fakeDataId1'],
          },
        },
        result: {
          transactions: {
            [channelId]: [{ transaction: encryptedTx, timestamp: 1 }],
          },
        },
      };
      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy.returns(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: chai.spy(),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: {
          [channelId]: [tx],
        },
      });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [null],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).to.have.been.called.with(extraTopics[0]);
    });

    it('cannot get an encrypted channel indexed by topic without decryptionProvider', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);

      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetChannelsByTopic = {
        meta: {
          transactionsStorageLocation: {
            [channelId]: ['fakeDataId1'],
          },
        },
        result: {
          transactions: {
            [channelId]: [{ transaction: encryptedTx, timestamp: 1 }],
          },
        },
      };
      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy.returns(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: chai.spy(),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: {
          [channelId]: [null],
        },
      });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [
            {
              reason: 'No decryption provider given',
              transaction: { transaction: encryptedTx, timestamp: 1 },
            },
          ],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).to.have.been.called.with(extraTopics[0]);
    });

    it('can get an clear channel indexed by topic without decryptionProvider even if an encrypted transaction happen first', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);

      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetChannelsByTopic = {
        meta: {
          transactionsStorageLocation: {
            [channelId]: ['fakeDataId1', 'fakeDataId2'],
          },
        },
        result: {
          transactions: {
            [channelId]: [
              { transaction: encryptedTx, timestamp: 1 },
              { transaction: { data }, timestamp: 2 },
            ],
          },
        },
      };
      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy.returns(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: chai.spy(),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: {
          [channelId]: [null, { transaction: { data }, timestamp: 2 }],
        },
      });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [
            {
              reason: 'No decryption provider given',
              transaction: { transaction: encryptedTx, timestamp: 1 },
            },
            null,
          ],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).to.have.been.called.with(extraTopics[0]);
    });

    it('can get channels indexed by topics with channelId not matching the first transaction hash', async () => {
      const txWrongHash: DataAccessTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { data: '{"wrong": "hash"}' },
      };

      const fakeMetaDataAccessGetReturnFirstHashWrong: DataAccessTypes.IReturnGetChannelsByTopic = {
        meta: {
          transactionsStorageLocation: {
            [channelId]: ['fakeDataId1', 'fakeDataId1', 'fakeDataId2'],
          },
        },
        result: { transactions: { [channelId]: [txWrongHash, tx, tx2] } },
      };
      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy.returns(fakeMetaDataAccessGetReturnFirstHashWrong),
        getTransactionsByChannelId: chai.spy(),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: { [channelId]: [null, tx, tx2] },
      });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnFirstHashWrong.meta,
        ignoredTransactions: {
          [channelId]: [
            {
              reason:
                'as first transaction, the hash of the transaction do not match the channelId',
              transaction: txWrongHash,
            },
            null,
            null,
          ],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).to.have.been.called.with(extraTopics[0]);
    });

    it('can get channels encrypted and clear', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);

      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetChannelsByTopic = {
        meta: {
          transactionsStorageLocation: {
            [channelId]: ['fakeDataId1'],
            [channelId2]: ['fakeDataId2'],
          },
        },
        result: {
          transactions: {
            [channelId]: [{ transaction: encryptedTx, timestamp: 1 }],
            [channelId2]: [{ transaction: { data: data2 }, timestamp: 1 }],
          },
        },
      };
      fakeDataAccess = {
        getChannelsByMultipleTopics: chai.spy(),
        getChannelsByTopic: chai.spy.returns(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: chai.spy(),
        initialize: chai.spy(),
        persistTransaction: chai.spy(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal({
        transactions: {
          [channelId]: [tx],
          [channelId2]: [tx2],
        },
      });
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [null],
          [channelId2]: [null],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).to.have.been.called.with(extraTopics[0]);
    });
  });

  describe('getChannelsByMultipleTopic', () => {
    it('can get channels indexed by topics', async () => {
      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByMultipleTopics([extraTopics[0]]);

      expect(ret.result, 'ret.result is wrong').to.be.deep.equal(
        fakeMetaDataAccessGetChannelsReturn.result,
      );
      expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
        dataAccessMeta: fakeMetaDataAccessGetChannelsReturn.meta,
        ignoredTransactions: {
          '01a98f126de3fab2b5130af5161998bf6e59b2c380deafeff938ff3f798281bf23': [null, null],
        },
      });
      expect(fakeDataAccess.getChannelsByMultipleTopics).to.have.been.called.with([extraTopics[0]]);
    });
  });
});
