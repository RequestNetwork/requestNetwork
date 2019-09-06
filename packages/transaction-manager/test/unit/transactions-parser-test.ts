import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

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

  describe('parsePersistedTransaction', async () => {
    it('cannot parse transaction not well formatted', async () => {
      await expect(
        transactionParser.parsePersistedTransaction(
          { hash: 'hash', encryptionMethod: 'encryptionMethod' },
          TransactionTypes.ChannelType.UNKNOWN,
        ),
        'must reject',
      ).to.eventually.be.rejectedWith('Transaction must have a property "data" or "encryptedData"');
    });

    describe('parse clear persisted transaction', async () => {
      it('can parse clear transaction on an unknown channel', async () => {
        const tx = await TransactionsFactory.createClearTransaction(data);

        const ret = await transactionParser.parsePersistedTransaction(
          tx,
          TransactionTypes.ChannelType.UNKNOWN,
        );

        expect(await ret.transaction.getData(), 'transaction wrong').to.be.equal(data);
        expect(ret.channelKey, 'channelKey wrong').to.be.undefined;
      });
      it('cannot parse clear transaction not well formatted', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', encryptedData: 'encryptedData' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'only the property "data" is allowed for clear transaction',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', encryptionMethod: 'encMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'only the property "data" is allowed for clear transaction',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', hash: 'hash' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'only the property "data" is allowed for clear transaction',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            { data: 'data', keys: {} },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'only the property "data" is allowed for clear transaction',
        );
      });
      it('cannot parse clear transaction on an encrypted channel', async () => {
        const tx = await TransactionsFactory.createClearTransaction(data);
        await expect(
          transactionParser.parsePersistedTransaction(tx, TransactionTypes.ChannelType.ENCRYPTED),
          'must reject',
        ).to.eventually.be.rejectedWith('Clear transactions are not allowed in encrypted channel');
      });
    });

    describe('parse encrypted persisted transaction', async () => {
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

        expect(await ret.transaction.getData(), 'transaction wrong').to.be.equal(data);
        expect(ret.channelKey, 'channelKey wrong').to.be.not.undefined;
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
          'must reject',
        ).to.eventually.be.rejectedWith(`No decryption provider given`);
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
          'must reject',
        ).to.eventually.be.rejectedWith(
          `Impossible to decrypt the channel key from this transaction (The encrypted data is not well formatted)`,
        );
      });
      it('cannot parse encrypted transaction with a encryption method not supported', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            {
              encryptedData: 'encryptedData',
              encryptionMethod: 'encryptionMethod',
              hash: 'hash',
              keys: {},
            },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(`Encryption method not supported: encryptionMethod`);
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
          'must reject',
        ).to.eventually.be.rejectedWith('Encrypted transactions are not allowed in clear channel');
      });
      it('cannot parse encrypted transaction without hash', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'the property "hash" is missing for the encrypted transaction',
        );
      });
      it('cannot parse encrypted transaction without channelKey with no encryptionMethod or keys', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData', hash: 'hash', encryptionMethod: 'encryptionMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'the properties "encryptionMethod" and "keys" are needed to compute the channel key',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            {
              encryptedData: 'encryptedData',
              hash: 'hash',
              keys: {},
            },
            TransactionTypes.ChannelType.UNKNOWN,
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'the properties "encryptionMethod" and "keys" are needed to compute the channel key',
        );
      });
      it('cannot parse encrypted transaction with channelKey AND with encryptionMethod or keys', async () => {
        await expect(
          transactionParser.parsePersistedTransaction(
            { encryptedData: 'encryptedData', hash: 'hash', encryptionMethod: 'encryptionMethod' },
            TransactionTypes.ChannelType.UNKNOWN,
            { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_CBC },
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'the properties "encryptionMethod" and "keys" have been already given for this channel',
        );

        await expect(
          transactionParser.parsePersistedTransaction(
            {
              encryptedData: 'encryptedData',
              hash: 'hash',
              keys: {},
            },
            TransactionTypes.ChannelType.UNKNOWN,
            { key: 'channelKey', method: EncryptionTypes.METHOD.AES256_CBC },
          ),
          'must reject',
        ).to.eventually.be.rejectedWith(
          'the properties "encryptionMethod" and "keys" have been already given for this channel',
        );
      });
    });
  });
});
