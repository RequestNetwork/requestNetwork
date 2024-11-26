import { EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import TransactionsFactory from '../../src/transactions-factory';
import TransactionsParser from '../../src/transactions-parser';
import * as TestData from './utils/test-data';

jest.setTimeout(20000); // in milliseconds

let transactionParser: TransactionsParser;

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';

/* eslint-disable @typescript-eslint/no-unused-expressions */
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

    const encryptedTests = (decryption?: any, provider?: any) => {
      describe('parse encrypted persisted transaction', () => {
        beforeEach(() => {
          transactionParser = new TransactionsParser(decryption, provider);
        });
        it('can parse encrypted transaction on an unknown channel', async () => {
          const encryptedParsedTx =
            await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
              TestData.idRaw1.encryptionParams,
              TestData.idRaw2.encryptionParams,
              TestData.idRaw3.encryptionParams,
            ]);

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
          const encryptedParsedTx =
            await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
              TestData.idRaw1.encryptionParams,
            ]);

          await expect(
            transactionParser.parsePersistedTransaction(
              encryptedParsedTx,
              TransactionTypes.ChannelType.UNKNOWN,
            ),
          ).rejects.toThrowError(`No decryption or cipher provider given`);
        });
        it('cannot parse encrypted transaction with keys corrupted', async () => {
          const encryptedParsedTx =
            await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
              TestData.idRaw1.encryptionParams,
            ]);

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

          const encryptedParsedTx =
            await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
              TestData.idRaw1.encryptionParams,
              TestData.idRaw2.encryptionParams,
            ]);
          await expect(
            transactionParser.parsePersistedTransaction(
              encryptedParsedTx,
              TransactionTypes.ChannelType.CLEAR,
            ),
          ).rejects.toThrowError('Encrypted transactions are not allowed in clear channel');
        });
        it('cannot parse encrypted transaction without channelKey without encryptionMethod and transaction missing encryptionMethod or keys', async () => {
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
        it('cannot parse encrypted transaction without channelKey with encryptionMethod and transaction contains encryptionMethod', async () => {
          await expect(
            transactionParser.parsePersistedTransaction(
              { encryptedData: 'encryptedData', encryptionMethod: 'encryptionMethod' },
              TransactionTypes.ChannelType.UNKNOWN,
              undefined,
              `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`,
            ),
          ).rejects.toThrowError(
            'the "encryptionMethod" property has been already given for this channel',
          );
        });
        it('cannot parse encrypted transaction without channelKey with encryptionMethod and transaction missing keys', async () => {
          await expect(
            transactionParser.parsePersistedTransaction(
              { encryptedData: 'encryptedData' },
              TransactionTypes.ChannelType.UNKNOWN,
              undefined,
              `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`,
            ),
          ).rejects.toThrowError('the "keys" property is needed to compute the channel key');
        });
        it('cannot parse encrypted transaction with channelKey without encryptionMethod and transaction missing encryptionMethod', async () => {
          await expect(
            transactionParser.parsePersistedTransaction(
              { encryptedData: 'encryptedData' },
              TransactionTypes.ChannelType.UNKNOWN,
              { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_GCM },
            ),
          ).rejects.toThrowError(
            'the "encryptionMethod" property is needed to use the channel key',
          );
        });
        it('cannot parse encrypted transaction with channelKey with encryptionMethod and transaction contains encryptionMethod', async () => {
          await expect(
            transactionParser.parsePersistedTransaction(
              { encryptedData: 'encryptedData', encryptionMethod: 'encryptionMethod' },
              TransactionTypes.ChannelType.UNKNOWN,
              { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_GCM },
              `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`,
            ),
          ).rejects.toThrowError(
            'the "encryptionMethod" property has been already given for this channel',
          );
        });
      });
    };

    encryptedTests(TestData.fakeDecryptionProvider);
    encryptedTests(undefined, TestData.fakeEpkCipherProvider);

    describe('parse encrypted persisted transaction with LitProtocol', () => {
      beforeEach(() => {
        transactionParser = new TransactionsParser(undefined, TestData.fakeLitProtocolProvider);
      });
      it('can parse encrypted transaction on an unknown channel', async () => {
        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [
            TestData.kmsRaw1.encryptionParams,
            TestData.kmsRaw2.encryptionParams,
            TestData.kmsRaw3.encryptionParams,
          ],
          TestData.fakeLitProtocolProvider,
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
        ).rejects.toThrowError('No decryption or cipher provider given');
      });

      it('cannot parse encrypted transaction with keys corrupted', async () => {
        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [TestData.kmsRaw1.encryptionParams],
          TestData.fakeLitProtocolProvider,
        );

        const addRaw1Formatted = `20${TestData.kmsRaw1.encryptionParams.key.slice(2)}`;
        encryptedParsedTx.keys = { [addRaw1Formatted]: '02Corrupted keys' };

        await expect(
          transactionParser.parsePersistedTransaction(
            encryptedParsedTx,
            TransactionTypes.ChannelType.UNKNOWN,
          ),
        ).rejects.toThrowError(`Invalid encryption response format`);
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
        const encryptedParsedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [TestData.kmsRaw1.encryptionParams, TestData.kmsRaw2.encryptionParams],
          TestData.fakeLitProtocolProvider,
        );
        await expect(
          transactionParser.parsePersistedTransaction(
            encryptedParsedTx,
            TransactionTypes.ChannelType.CLEAR,
          ),
        ).rejects.toThrowError('Encrypted transactions are not allowed in clear channel');
      });
      it('cannot parse encrypted transaction without channelKey without encryptionMethod and transaction missing encryptionMethod or keys', async () => {
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
      it('cannot parse encrypted transaction without channelKey with encryptionMethod and transaction contains encryptionMethod', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData', encryptionMethod: 'encryptionMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
            undefined,
            `${EncryptionTypes.METHOD.KMS}-${EncryptionTypes.METHOD.AES256_GCM}`,
          ),
        ).rejects.toThrowError(
          'the "encryptionMethod" property has been already given for this channel',
        );
      });
      it('cannot parse encrypted transaction without channelKey with encryptionMethod and transaction missing keys', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData' },
            TransactionTypes.ChannelType.UNKNOWN,
            undefined,
            `${EncryptionTypes.METHOD.KMS}-${EncryptionTypes.METHOD.AES256_GCM}`,
          ),
        ).rejects.toThrowError('the "keys" property is needed to compute the channel key');
      });
      it('cannot parse encrypted transaction with channelKey without encryptionMethod and transaction missing encryptionMethod', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData' },
            TransactionTypes.ChannelType.UNKNOWN,
            { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_GCM },
          ),
        ).rejects.toThrowError('the "encryptionMethod" property is needed to use the channel key');
      });
      it('cannot parse encrypted transaction with channelKey with encryptionMethod and transaction contains encryptionMethod', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData', encryptionMethod: 'encryptionMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
            { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_GCM },
            `${EncryptionTypes.METHOD.KMS}-${EncryptionTypes.METHOD.AES256_GCM}`,
          ),
        ).rejects.toThrowError(
          'the "encryptionMethod" property has been already given for this channel',
        );
      });
    });
  });
});
