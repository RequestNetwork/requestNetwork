import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import MultiFormat from '@requestnetwork/multi-format';
import { TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import ChannelParser from '../../src/channel-parser';
import TransactionsFactory from '../../src/transactions-factory';
import * as TestData from './utils/test-data';

let channelParser: ChannelParser;

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
const data2 = '{"or": "can", "be":false}';

const tx: TransactionTypes.IConfirmedTransaction = { transaction: { data }, timestamp: 1 };
const tx2: TransactionTypes.IConfirmedTransaction = { transaction: { data: data2 }, timestamp: 1 };

const dataHash = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data));
const channelId = MultiFormat.serialize(dataHash);
const dataHash2 = Utils.crypto.normalizeKeccak256Hash(JSON.parse(data2));
const channelId2 = MultiFormat.serialize(dataHash2);

/* tslint:disable:no-unused-expression */
describe('channel-parser', () => {
  beforeEach(() => {
    channelParser = new ChannelParser();
  });

  describe('decryptAndCleanChannel', async () => {
    it('can clean a clear channel', async () => {
      const ret = await channelParser.decryptAndCleanChannel(channelId, [tx, tx2]);

      expect(ret.ignoredTransactions, 'ignoredTransactions wrong').to.be.deep.equal([null, null]);
      expect(ret.transactions, 'transactions wrong').to.be.deep.equal([tx, tx2]);
    });
    it('can clean a clear channel with first transaction hash not matching', async () => {
      const ret = await channelParser.decryptAndCleanChannel(channelId2, [tx, tx2]);

      expect(ret.ignoredTransactions, 'ignoredTransactions wrong').to.be.deep.equal([
        {
          reason: 'as first transaction, the hash of the transaction do not match the channelId',
          transaction: tx,
        },
        null,
      ]);
      expect(ret.transactions, 'transactions wrong').to.be.deep.equal([null, tx2]);
    });
    it('can clean a clear channel with a transaction data not parsable', async () => {
      const txNotParsable: TransactionTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { data: 'not parsable' },
      };

      const ret = await channelParser.decryptAndCleanChannel(channelId, [tx, txNotParsable]);

      expect(ret.ignoredTransactions, 'ignoredTransactions wrong').to.be.deep.equal([
        null,
        {
          reason: 'Impossible to JSON parse the transaction',
          transaction: txNotParsable,
        },
      ]);
      expect(ret.transactions, 'transactions wrong').to.be.deep.equal([tx, null]);
    });
    it('can clean a clear channel with a transaction not well formated', async () => {
      const txNotFormatted: TransactionTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { noData: 'here' } as any,
      };

      const ret = await channelParser.decryptAndCleanChannel(channelId, [tx, txNotFormatted]);

      expect(ret.ignoredTransactions, 'ignoredTransactions wrong').to.be.deep.equal([
        null,
        {
          reason: 'Transaction must have a property "data" or "encryptedData"',
          transaction: txNotFormatted,
        },
      ]);
      expect(ret.transactions, 'transactions wrong').to.be.deep.equal([tx, null]);
    });
    it('can decrypt an encrypted channel', async () => {
      channelParser = new ChannelParser(TestData.fakeDecryptionProvider);
      const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data,
        [TestData.idRaw1.encryptionParams],
      );
      const confirmedTx = { transaction: encryptedParsedTx, timestamp: 1 };
      const ret = await channelParser.decryptAndCleanChannel(channelId, [confirmedTx]);

      expect(ret.ignoredTransactions, 'ignoredTransactions wrong').to.be.deep.equal([null]);
      expect(ret.transactions, 'transactions wrong').to.be.deep.equal([
        { transaction: { data }, timestamp: 1 },
      ]);
    });
  });

  describe('getChannelTypeAndChannelKey', async () => {
    it('can get channel type on a clear channel', async () => {
      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [tx, tx2]);

      expect(ret.channelKey, 'channelKey wrong').to.be.undefined;
      expect(ret.channelType, 'channelType wrong').to.be.equal(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on a clear channel with first transaction hash not matching', async () => {
      const ret = await channelParser.getChannelTypeAndChannelKey(channelId2, [tx, tx2]);

      expect(ret.channelKey, 'channelKey wrong').to.be.undefined;
      expect(ret.channelType, 'channelType wrong').to.be.equal(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on a clear channel with a transaction data not parsable', async () => {
      const txNotParsable: TransactionTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { data: 'not parsable' },
      };

      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [txNotParsable, tx]);

      expect(ret.channelKey, 'channelKey wrong').to.be.undefined;
      expect(ret.channelType, 'channelType wrong').to.be.equal(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on a clear channel with a transaction not well formated', async () => {
      const txNotFormatted: TransactionTypes.IConfirmedTransaction = {
        timestamp: 1,
        transaction: { noData: 'here' } as any,
      };

      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [txNotFormatted, tx]);

      expect(ret.channelKey, 'channelKey wrong').to.be.undefined;
      expect(ret.channelType, 'channelType wrong').to.be.equal(TransactionTypes.ChannelType.CLEAR);
    });

    it('can get channel type on an encrypted channel', async () => {
      channelParser = new ChannelParser(TestData.fakeDecryptionProvider);
      const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data,
        [TestData.idRaw1.encryptionParams],
      );
      const confirmedTx = { transaction: encryptedParsedTx, timestamp: 1 };
      const ret = await channelParser.getChannelTypeAndChannelKey(channelId, [confirmedTx]);

      expect(ret.channelKey, 'channelKey wrong').to.be.not.undefined;
      expect(ret.channelType, 'channelType wrong').to.be.equal(
        TransactionTypes.ChannelType.ENCRYPTED,
      );
    });
  });
});
