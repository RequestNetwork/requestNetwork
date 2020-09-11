import { EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import TransactionsFactory from '../../src/transactions-factory';
import TransactionsParser from '../../src/transactions-parser';
import * as TestData from './utils/test-data';

let transactionParser: TransactionsParser;

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';

/* tslint:disable:no-unused-expression */
describe('transaction-parser', () => {
  beforeEach(() => {
    transactionParser = new TransactionsParser();
  });

  describe('parsePersistedTransaction', () => {
    it('cannot parse transaction not well formatted', async () => {
      await expect(
        transactionParser.parsePersistedTransaction(
          { encryptionMethod: 'encryptionMethod' },
          TransactionTypes.ChannelType.UNKNOWN,
        ),
      ).rejects.toThrowError('Transaction must have a property "data" or "encryptedData"');
    });

    describe('parse clear persisted transaction', () => {
      it('can parse clear transaction on an unknown channel', async () => {
        const tx = await TransactionsFactory.createClearTransaction(data);

        const ret = await transactionParser.parsePersistedTransaction(
          tx,
          TransactionTypes.ChannelType.UNKNOWN,
        );

        // 'transaction wrong'
        expect(await ret.transaction.getData()).toBe(data);
        // 'channelKey wrong'
        expect(ret.channelKey).toBeUndefined();
      });
      it('cannot parse clear transaction not well formatted', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', encryptedData: 'encryptedData' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError('only the property "data" is allowed for clear transaction');

        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', encryptionMethod: 'encMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError('only the property "data" is allowed for clear transaction');

        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', keys: {} },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError('only the property "data" is allowed for clear transaction');
      });
      it('cannot parse clear transaction on an encrypted channel', async () => {
        const tx = await TransactionsFactory.createClearTransaction(data);
        await expect(
          transactionParser.parsePersistedTransaction(tx, TransactionTypes.ChannelType.ENCRYPTED),
        ).rejects.toThrowError('Clear transactions are not allowed in encrypted channel');
      });
    });

    describe('parse encrypted persisted transaction', () => {
      beforeEach(() => {
        transactionParser = new TransactionsParser(TestData.fakeDecryptionProvider);
      });
      it('can parse encrypted transaction on an unknown channel', async () => {
        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [
            TestData.idRaw1.encryptionParams,
            TestData.idRaw2.encryptionParams,
            TestData.idRaw3.encryptionParams,
          ],
        );

        const ret = await transactionParser.parsePersistedTransaction(
          encryptedParsedTx,
          TransactionTypes.ChannelType.UNKNOWN,
        );

        // 'transaction wrong'
        expect(await ret.transaction.getData()).toBe(data);
        // 'channelKey wrong'
        expect(ret.channelKey).toBeDefined();
      });
      it('cannot parse encrypted transaction without decryptionProvider', async () => {
        transactionParser = new TransactionsParser();
        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [TestData.idRaw1.encryptionParams],
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            encryptedParsedTx,
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError(`No decryption provider given`);
      });
      it('cannot parse encrypted transaction with keys corrupted', async () => {
        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [TestData.idRaw1.encryptionParams],
        );

        const addRaw1Formatted = `20${TestData.idRaw1.address.slice(2)}`;
        encryptedParsedTx.keys = { [addRaw1Formatted]: '02Corrupted keys' };

        await expect(
          transactionParser.parsePersistedTransaction(
            encryptedParsedTx,
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError(
          `Impossible to decrypt the channel key from this transaction (The encrypted data is not well formatted)`,
        );
      });
      it('cannot parse encrypted transaction with a encryption method not supported', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            {
              encryptedData: 'encryptedData',
              encryptionMethod: 'encryptionMethod',
              keys: {},
            },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError(`Encryption method not supported: encryptionMethod`);
      });
      it('cannot parse encrypted transaction on an clear channel', async () => {
        transactionParser = new TransactionsParser(TestData.fakeDecryptionProvider);

        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [TestData.idRaw1.encryptionParams, TestData.idRaw2.encryptionParams],
        );
        await expect(
          transactionParser.parsePersistedTransaction(
            encryptedParsedTx,
            TransactionTypes.ChannelType.CLEAR,
          ),
        ).rejects.toThrowError('Encrypted transactions are not allowed in clear channel');
      });
      it('cannot parse encrypted transaction without channelKey with no encryptionMethod or keys', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData', encryptionMethod: 'encryptionMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError(
          'the properties "encryptionMethod" and "keys" are needed to compute the channel key',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            {
              encryptedData: 'encryptedData',
              keys: {},
            },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError(
          'the properties "encryptionMethod" and "keys" are needed to compute the channel key',
        );
      });
      it('cannot parse encrypted transaction with channelKey AND with encryptionMethod or keys', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData', encryptionMethod: 'encryptionMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
            { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_GCM },
          ),
        ).rejects.toThrowError(
          'the properties "encryptionMethod" and "keys" have been already given for this channel',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            {
              encryptedData: 'encryptedData',
              keys: {},
            },
            TransactionTypes.ChannelType.UNKNOWN,
            { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_GCM },
          ),
        ).rejects.toThrowError(
          'the properties "encryptionMethod" and "keys" have been already given for this channel',
        );
      });
    });
  });
});
