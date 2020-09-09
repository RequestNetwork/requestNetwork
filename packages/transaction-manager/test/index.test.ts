import MultiFormat from '@requestnetwork/multi-format';
import Utils from '@requestnetwork/utils';

import { EventEmitter } from 'events';

import { DataAccessTypes, EncryptionTypes, TransactionTypes } from '@requestnetwork/types';

import { TransactionManager } from '../src/index';
import TransactionsFactory from '../src/transactions-factory';

import * as TestData from './unit/utils/test-data';

const extraTopics = ['topic1', 'topic2'];
const fakeTxHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
const data2 = '{"or": "can", "be":false}';

const tx: DataAccessTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: 1,
  transaction: { data },
};
const tx2: DataAccessTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: 1,
  transaction: { data: data2 },
};

const dataHash = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data));
const channelId = MultiFormat.serialize(dataHash);
const dataHash2 = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data2));
const channelId2 = MultiFormat.serialize(dataHash2);

const fakeMetaDataAccessPersistReturn: DataAccessTypes.IReturnPersistTransaction = Object.assign(
  new EventEmitter(),
  {
    meta: { transactionStorageLocation: 'fakeDataId', topics: extraTopics },
    result: { topics: [fakeTxHash] },
  },
);

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
      _getStatus: jest.fn(),
      getChannelsByMultipleTopics: jest.fn().mockReturnValue(fakeMetaDataAccessGetChannelsReturn),
      getChannelsByTopic: jest.fn().mockReturnValue(fakeMetaDataAccessGetChannelsReturn),
      getTransactionsByChannelId: jest.fn().mockReturnValue(fakeMetaDataAccessGetReturn),
      initialize: jest.fn(),
      // persistTransaction: jest.fn().mockReturnValue(fakeMetaDataAccessPersistReturn),
      persistTransaction: jest.fn((): any => {
        setTimeout(() => {
          fakeMetaDataAccessPersistReturn.emit(
            'confirmed',
            {
              meta: { transactionStorageLocation: 'fakeDataId', topics: extraTopics },
              result: { topics: [fakeTxHash] },
            },
            // tslint:disable-next-line:no-magic-numbers
            100,
          );
        });
        return fakeMetaDataAccessPersistReturn;
      }),
    };
  });

  describe('persistTransaction', () => {
    describe('in a new channel', () => {
      it('can persist a clear transaction in a new channel', async () => {
        const transactionManager = new TransactionManager(fakeDataAccess);

        const ret = await transactionManager.persistTransaction(data, channelId, extraTopics);

        const resultConfirmed1 = await new Promise((resolve) => ret.on('confirmed', resolve));
        // 'result Confirmed wrong'
        expect(resultConfirmed1).toEqual({
          meta: {
            dataAccessMeta: { transactionStorageLocation: 'fakeDataId', topics: extraTopics },
            encryptionMethod: undefined,
          },
          result: {},
        });

        // 'ret.result is wrong'
        expect(ret.result).toEqual({});
        // 'ret.meta is wrong'
        expect(ret.meta).toEqual({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: undefined,
        });
        expect(fakeDataAccess.persistTransaction).toHaveBeenCalledWith(
          await TransactionsFactory.createClearTransaction(data),
          channelId,
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

        // 'ret.result is wrong'
        expect(ret.result).toEqual({});
        // 'ret.meta is wrong'
        expect(ret.meta).toEqual({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: 'ecies-aes256-gcm',
        });
        expect(fakeDataAccess.persistTransaction).toHaveBeenCalledTimes(1);
      });

      it('cannot persist a transaction if data access emit error', async () => {
        const fakeDataAccessEmittingError = Object.assign({}, fakeDataAccess);
        fakeDataAccessEmittingError.persistTransaction = jest.fn((): any => {
          const persistWithEvent = Object.assign(
            new EventEmitter(),
            fakeMetaDataAccessPersistReturn,
          );
          setTimeout(() => {
            // tslint:disable-next-line:no-magic-numbers
            persistWithEvent.emit('error', 'error for test purpose', 100);
          });
          return persistWithEvent;
        });

        const transactionManager = new TransactionManager(fakeDataAccess);

        const ret = await transactionManager.persistTransaction(data, channelId, extraTopics);

        ret.on('error', (error) => {
          // 'result Confirmed wrong'
          expect(error).toBe('error for test purpose');
        });

        // 'ret.result is wrong'
        expect(ret.result).toEqual({});
        // 'ret.meta is wrong'
        expect(ret.meta).toEqual({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: undefined,
        });
        expect(fakeDataAccess.persistTransaction).toHaveBeenCalledWith(
          await TransactionsFactory.createClearTransaction(data),
          channelId,
          extraTopics.concat([channelId]),
        );
      });
    });

    describe('in an existing new channel', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });
      it('can persist a clear transaction in an existing channel', async () => {
        const transactionManager = new TransactionManager(fakeDataAccess);

        const ret = await transactionManager.persistTransaction(data2, channelId, extraTopics);

        // 'ret.result is wrong'
        expect(ret.result).toEqual({});
        // 'ret.meta is wrong'
        expect(ret.meta).toEqual({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: undefined,
        });
        expect(fakeDataAccess.persistTransaction).toHaveBeenCalledWith(
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
            transactions: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            ],
          },
        };

        fakeDataAccess = {
          _getStatus: jest.fn(),
          getChannelsByMultipleTopics: jest.fn(),
          getChannelsByTopic: jest.fn(),
          getTransactionsByChannelId: jest
            .fn()
            .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
          initialize: jest.fn(),
          persistTransaction: jest.fn().mockReturnValue(fakeMetaDataAccessPersistReturn),
        };

        const transactionManager = new TransactionManager(
          fakeDataAccess,
          TestData.fakeDecryptionProvider,
        );
        const ret = await transactionManager.persistTransaction(data2, channelId, extraTopics);

        // 'ret.result is wrong'
        expect(ret.result).toEqual({});
        // 'ret.meta is wrong'
        expect(ret.meta).toEqual({
          dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
          encryptionMethod: 'ecies-aes256-gcm',
        });

        // TODO challenge this
        expect(fakeDataAccess.persistTransaction).toHaveBeenCalledWith(
          {
            encryptedData: expect.stringMatching(/^04.{76}/),
          },
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
          _getStatus: jest.fn(),
          getChannelsByMultipleTopics: jest.fn(),
          getChannelsByTopic: jest.fn(),
          getTransactionsByChannelId: jest.fn().mockReturnValue(fakeMetaDataAccessGetReturnEmpty),
          initialize: jest.fn(),
          persistTransaction: jest.fn().mockReturnValue(fakeMetaDataAccessPersistReturn),
        };

        const transactionManager = new TransactionManager(
          fakeDataAccess,
          TestData.fakeDecryptionProvider,
        );
        await expect(
          transactionManager.persistTransaction(data2, channelId, extraTopics),
        ).rejects.toThrowError(`Impossible to retrieve the channel: ${channelId}`);
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
            transactions: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            ],
          },
        };

        fakeDataAccess = {
          _getStatus: jest.fn(),
          getChannelsByMultipleTopics: jest.fn(),
          getChannelsByTopic: jest.fn(),
          getTransactionsByChannelId: jest
            .fn()
            .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
          initialize: jest.fn(),
          persistTransaction: jest.fn().mockReturnValue(fakeMetaDataAccessPersistReturn),
        };

        const transactionManager = new TransactionManager(
          fakeDataAccess,
          TestData.fakeDecryptionProvider,
        );
        await expect(
          transactionManager.persistTransaction(data2, channelId, extraTopics, [
            TestData.idRaw1.encryptionParams,
          ]),
        ).rejects.toThrowError('Impossible to add new stakeholder to an existing channel');
      });
    });
  });

  describe('getTransactionsByChannelId', () => {
    it('can get transactions by channel id', async () => {
      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'ret.result is wrong'
      expect(ret.result).toEqual(fakeMetaDataAccessGetReturn.result);
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetReturn.meta,
        ignoredTransactions: [null, null],
      });
      expect(fakeDataAccess.getTransactionsByChannelId).toHaveBeenCalledWith(channelId, undefined);
    });

    it('can getTransactionsByChannelId() with channelId not matching the first transaction hash', async () => {
      const txWrongHash: DataAccessTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: { data: '{"wrong": "hash"}' },
      };

      const fakeMetaDataAccessGetReturnFirstHashWrong: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1', 'fakeDataId1', 'fakeDataId2'] },
        result: { transactions: [txWrongHash, tx, tx2] },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnFirstHashWrong),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
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

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: [null, tx, tx2],
      });
      expect(fakeDataAccess.getTransactionsByChannelId).toHaveBeenCalledWith(channelId, undefined);
    });

    it('can getTransactionsByChannelId() the first transaction data not parsable', async () => {
      const txWrongHash: DataAccessTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: { data: 'Not parsable' },
      };

      const fakeMetaDataAccessGetReturnFirstHashWrong: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1', 'fakeDataId1', 'fakeDataId2'] },
        result: { transactions: [txWrongHash, tx, tx2] },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnFirstHashWrong),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
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

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: [null, tx, tx2],
      });
      expect(fakeDataAccess.getTransactionsByChannelId).toHaveBeenCalledWith(channelId, undefined);
    });

    it('can get a transaction from an encrypted channel', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);
      const fakeMetaDataAccessGetReturnWithEncryptedTransaction: DataAccessTypes.IReturnGetTransactions = {
        meta: { transactionsStorageLocation: ['fakeDataId1'] },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: encryptedTx,
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: { transactionsStorageLocation: ['fakeDataId1'] },
          encryptionMethod: 'ecies-aes256-gcm',
          ignoredTransactions: [null],
        },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: { data },
            },
          ],
        },
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
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: encryptedTx,
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: { transactionsStorageLocation: ['fakeDataId1'] },
          ignoredTransactions: [
            {
              reason: 'No decryption provider given',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
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
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: encryptedTx,
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: encryptedTx2,
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          encryptionMethod: 'ecies-aes256-gcm',
          ignoredTransactions: [
            null,
            {
              reason:
                'the properties "encryptionMethod" and "keys" have been already given for this channel',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: encryptedTx2,
              },
            },
          ],
        },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: { data },
            },
            null,
          ],
        },
      });
    });

    it('can get two transactions with different encryptions from the same encrypted channel the first has the right hash but wrong data', async () => {
      const encryptedTxFakeHash = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data2,
        [TestData.idRaw3.encryptionParams],
      );

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
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: encryptedTxFakeHash,
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: encryptedTx,
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          encryptionMethod: 'ecies-aes256-gcm',
          ignoredTransactions: [
            {
              reason:
                'as first transaction, the hash of the transaction do not match the channelId',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTxFakeHash,
              },
            },
            null,
          ],
        },
        result: {
          transactions: [
            null,
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: { data },
            },
          ],
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
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: encryptedTx,
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: { data: data2 },
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          encryptionMethod: 'ecies-aes256-gcm',
          ignoredTransactions: [
            null,
            {
              reason: `Clear transactions are not allowed in encrypted channel`,
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: { data: data2 },
              },
            },
          ],
        },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: { data },
            },
            null,
          ],
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
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: encryptedTx,
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: { data: data2 },
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );

      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          ignoredTransactions: [
            {
              reason: 'Impossible to decrypt the channel key from this transaction ()',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            },
            {
              reason:
                'as first transaction, the hash of the transaction do not match the channelId',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: { data: data2 },
              },
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
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: { data },
            },
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: encryptedTx,
            },
          ],
        },
      };

      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn(),
        getTransactionsByChannelId: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );
      const ret = await transactionManager.getTransactionsByChannelId(channelId);

      // 'return is wrong'
      expect(ret).toEqual({
        meta: {
          dataAccessMeta: {
            transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'],
          },
          ignoredTransactions: [
            null,
            {
              reason: 'Encrypted transactions are not allowed in clear channel',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: encryptedTx,
              },
            },
          ],
        },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 1,
              transaction: { data },
            },
            null,
          ],
        },
      });
    });
  });

  describe('getChannelsByTopic', () => {
    it('can get channels indexed by topics', async () => {
      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual(fakeMetaDataAccessGetChannelsReturn.result);
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetChannelsReturn.meta,
        ignoredTransactions: {
          '01a98f126de3fab2b5130af5161998bf6e59b2c380deafeff938ff3f798281bf23': [null, null],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).toHaveBeenCalledWith(extraTopics[0], undefined);
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
            [channelId]: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            ],
          },
        },
      };
      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: jest.fn(),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: {
          [channelId]: [tx],
        },
      });
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [null],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).toHaveBeenCalledWith(extraTopics[0], undefined);
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
            [channelId]: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            ],
          },
        },
      };
      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: jest.fn(),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: {
          [channelId]: [null],
        },
      });
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [
            {
              reason: 'No decryption provider given',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            },
          ],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).toHaveBeenCalledWith(extraTopics[0], undefined);
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
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 2,
                transaction: { data },
              },
            ],
          },
        },
      };
      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: jest.fn(),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: {
          [channelId]: [
            null,
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 2,
              transaction: { data },
            },
          ],
        },
      });
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [
            {
              reason: 'No decryption provider given',
              transaction: {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            },
            null,
          ],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).toHaveBeenCalledWith(extraTopics[0], undefined);
    });

    it('can get channels indexed by topics with channelId not matching the first transaction hash', async () => {
      const txWrongHash: DataAccessTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
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
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest.fn().mockReturnValue(fakeMetaDataAccessGetReturnFirstHashWrong),
        getTransactionsByChannelId: jest.fn(),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: { [channelId]: [null, tx, tx2] },
      });
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
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
      expect(fakeDataAccess.getChannelsByTopic).toHaveBeenCalledWith(extraTopics[0], undefined);
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
            [channelId]: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: encryptedTx,
              },
            ],
            [channelId2]: [
              {
                state: TransactionTypes.TransactionState.PENDING,
                timestamp: 1,
                transaction: { data: data2 },
              },
            ],
          },
        },
      };
      fakeDataAccess = {
        _getStatus: jest.fn(),
        getChannelsByMultipleTopics: jest.fn(),
        getChannelsByTopic: jest
          .fn()
          .mockReturnValue(fakeMetaDataAccessGetReturnWithEncryptedTransaction),
        getTransactionsByChannelId: jest.fn(),
        initialize: jest.fn(),
        persistTransaction: jest.fn(),
      };

      const transactionManager = new TransactionManager(
        fakeDataAccess,
        TestData.fakeDecryptionProvider,
      );

      const ret = await transactionManager.getChannelsByTopic(extraTopics[0]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual({
        transactions: {
          [channelId]: [tx],
          [channelId2]: [tx2],
        },
      });
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetReturnWithEncryptedTransaction.meta,
        ignoredTransactions: {
          [channelId]: [null],
          [channelId2]: [null],
        },
      });
      expect(fakeDataAccess.getChannelsByTopic).toHaveBeenCalledWith(extraTopics[0], undefined);
    });
  });

  describe('getChannelsByMultipleTopic', () => {
    it('can get channels indexed by topics', async () => {
      const transactionManager = new TransactionManager(fakeDataAccess);

      const ret = await transactionManager.getChannelsByMultipleTopics([extraTopics[0]]);

      // 'ret.result is wrong'
      expect(ret.result).toEqual(fakeMetaDataAccessGetChannelsReturn.result);
      // 'ret.meta is wrong'
      expect(ret.meta).toEqual({
        dataAccessMeta: fakeMetaDataAccessGetChannelsReturn.meta,
        ignoredTransactions: {
          '01a98f126de3fab2b5130af5161998bf6e59b2c380deafeff938ff3f798281bf23': [null, null],
        },
      });
      // tslint:disable-next-line: no-unbound-method
      expect(fakeDataAccess.getChannelsByMultipleTopics).toHaveBeenCalledWith(
        [extraTopics[0]],
        undefined,
      );
    });
  });
});
