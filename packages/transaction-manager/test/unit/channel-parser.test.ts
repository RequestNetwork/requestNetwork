import MultiFormat from '@requestnetwork/multi-format';
import { TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import ChannelParser from '../../src/channel-parser';
import TransactionsFactory from '../../src/transactions-factory';
import * as TestData from './utils/test-data';

let channelParser: ChannelParser;

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
const data2 = '{"or": "can", "be":false}';

const tx: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: 1,
  transaction: { data },
};
const tx2: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: 1,
  transaction: { data: data2 },
};

const dataHash = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data));
const channelId = MultiFormat.serialize(dataHash);
const dataHash2 = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data2));
const channelId2 = MultiFormat.serialize(dataHash2);

/* tslint:disable:no-unused-expression */
describe('channel-parser', () => {
  beforeEach(() => {
    channelParser = new ChannelParser();
  });

  describe('decryptAndCleanChannel', () => {
    it('can clean a clear channel', async () => {
      const ret = await channelParser.decryptAndCleanChannel(channelId, [tx, tx2]);

      // 'ignoredTransactions wrong'
      expect(ret.ignoredTransactions).toEqual([null, null]);
      // 'transactions wrong'
      expect(ret.transactions).toEqual([tx, tx2]);
    });
    it('can clean a clear channel with first transaction hash not matching', async () => {
      const ret = await channelParser.decryptAndCleanChannel(channelId2, [tx, tx2]);

      // 'ignoredTransactions wrong'
      expect(ret.ignoredTransactions).toEqual([
        {
          reason: 'as first transaction, the hash of the transaction do not match the channelId',
          transaction: tx,
        },
        null,
      ]);
      // 'transactions wrong'
      expect(ret.transactions).toEqual([null, tx2]);
    });
    it('can clean a clear channel with a transaction data not parsable', async () => {
      const txNotParsable: TransactionTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: { data: 'not parsable' },
      };

      const ret = await channelParser.decryptAndCleanChannel(channelId, [tx, txNotParsable]);

      // 'ignoredTransactions wrong'
      expect(ret.ignoredTransactions).toEqual([
        null,
        {
          reason: 'Impossible to JSON parse the transaction',
          transaction: txNotParsable,
        },
      ]);
      // 'transactions wrong'
      expect(ret.transactions).toEqual([tx, null]);
    });
    it('can clean a clear channel with a transaction not well formated', async () => {
      const txNotFormatted: TransactionTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: { noData: 'here' } as any,
      };

      const ret = await channelParser.decryptAndCleanChannel(channelId, [tx, txNotFormatted]);

      // 'ignoredTransactions wrong'
      expect(ret.ignoredTransactions).toEqual([
        null,
        {
          reason: 'Transaction must have a property "data" or "encryptedData"',
          transaction: txNotFormatted,
        },
      ]);
      // 'transactions wrong'
      expect(ret.transactions).toEqual([tx, null]);
    });
    it('can decrypt an encrypted channel', async () => {
      channelParser = new ChannelParser(TestData.fakeDecryptionProvider);
      const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data,
        [TestData.idRaw1.encryptionParams],
      );
      const confirmedTx = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: encryptedParsedTx,
      };
      const ret = await channelParser.decryptAndCleanChannel(channelId, [confirmedTx]);

      // 'ignoredTransactions wrong'
      expect(ret.ignoredTransactions).toEqual([null]);
      // 'transactions wrong'
      expect(ret.transactions).toEqual([
        {
          state: TransactionTypes.TransactionState.PENDING,
          timestamp: 1,
          transaction: { data },
        },
      ]);
    });
  });

  describe('getChannelTypeAndChannelKey', () => {
    it('can get channel type on a clear channel', async () => {
      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [tx, tx2]);

      // 'channelKey wrong'
      expect(ret.channelKey).toBeUndefined();
      // 'channelType wrong'
      expect(ret.channelType).toBe(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on a clear channel with first transaction hash not matching', async () => {
      const ret = await channelParser.getChannelTypeAndChannelKey(channelId2, [tx, tx2]);

      // 'channelKey wrong'
      expect(ret.channelKey).toBeUndefined();
      // 'channelType wrong'
      expect(ret.channelType).toBe(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on a clear channel with a transaction data not parsable', async () => {
      const txNotParsable: TransactionTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: { data: 'not parsable' },
      };

      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [txNotParsable, tx]);

      // 'channelKey wrong'
      expect(ret.channelKey).toBeUndefined();
      // 'channelType wrong'
      expect(ret.channelType).toBe(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on a clear channel with a transaction not well formated', async () => {
      const txNotFormatted: TransactionTypes.ITimestampedTransaction = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: { noData: 'here' } as any,
      };

      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [txNotFormatted, tx]);

      // 'channelKey wrong'
      expect(ret.channelKey).toBeUndefined();
      // 'channelType wrong'
      expect(ret.channelType).toBe(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on an encrypted channel', async () => {
      channelParser = new ChannelParser(TestData.fakeDecryptionProvider);
      const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data,
        [TestData.idRaw1.encryptionParams],
      );
      const confirmedTx = {
        state: TransactionTypes.TransactionState.PENDING,
        timestamp: 1,
        transaction: encryptedParsedTx,
      };
      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [confirmedTx]);

      // 'channelKey wrong'
      expect(ret.channelKey).toBeDefined();
      // 'channelType wrong'
      expect(ret.channelType).toBe(TransactionTypes.ChannelType.ENCRYPTED);
    });
  });
});
