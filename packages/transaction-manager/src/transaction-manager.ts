import MultiFormat from '@requestnetwork/multi-format';
import {
  DataAccessTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { EventEmitter } from 'events';

import ChannelParser from './channel-parser';
import TransactionsFactory from './transactions-factory';

/**
 * Implementation of TransactionManager layer without encryption
 */
export default class TransactionManager implements TransactionTypes.ITransactionManager {
  private dataAccess: DataAccessTypes.IDataAccess;
  private channelParser: ChannelParser;

  public constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider,
  ) {
    this.dataAccess = dataAccess;
    this.channelParser = new ChannelParser(decryptionProvider);
  }

  /**
   * Persists a transaction and topics in storage. If encryptionParams is given, the transaction will be encrypted
   *
   * @param transactionData transaction to persist
   * @param channelId string to identify a group of transactions
   * @param topics list of string to topic the transaction
   * @param encryptionParams list of encryption parameters to encrypt the channel key with
   *
   * @returns object containing the meta-data of the persist
   */
  public async persistTransaction(
    transactionData: TransactionTypes.ITransactionData,
    channelId: string,
    topics: string[] = [],
    encryptionParams: EncryptionTypes.IEncryptionParameters[] = [],
  ): Promise<TransactionTypes.IReturnPersistTransaction> {
    let transaction: TransactionTypes.IPersistedTransaction = {};
    let channelEncryptionMethod: string | undefined;

    // compute hash to add it to the topics
    const hash = MultiFormat.serialize(
      Utils.crypto.normalizeKeccak256Hash(JSON.parse(transactionData)),
    );

    // Need to create a new channel (only the first transaction can have the hash equals to the channel id)
    if (channelId === hash) {
      if (encryptionParams.length === 0) {
        // create a clear channel
        transaction = await TransactionsFactory.createClearTransaction(transactionData);
      } else {
        // create an encrypted channel
        transaction = await TransactionsFactory.createEncryptedTransactionInNewChannel(
          transactionData,
          encryptionParams,
        );
        channelEncryptionMethod = transaction.encryptionMethod;
      }

      // Add the transaction to an existing channel
    } else {
      const resultGetTx = await this.dataAccess.getTransactionsByChannelId(channelId);

      const {
        channelKey,
        channelType,
        encryptionMethod,
      } = await this.channelParser.getChannelTypeAndChannelKey(
        channelId,
        resultGetTx.result.transactions,
      );

      if (channelType === TransactionTypes.ChannelType.UNKNOWN) {
        throw new Error(`Impossible to retrieve the channel: ${channelId}`);
      }

      if (channelType === TransactionTypes.ChannelType.CLEAR) {
        // add the transaction to a clear channel
        transaction = await TransactionsFactory.createClearTransaction(transactionData);
      }

      if (channelType === TransactionTypes.ChannelType.ENCRYPTED) {
        // we cannot add new stakeholders to an existing channel
        if (encryptionParams.length !== 0) {
          throw new Error('Impossible to add new stakeholder to an existing channel');
        }

        if (!channelKey) {
          throw new Error(`Impossible to decrypt the channel key of: ${channelId}`);
        }

        transaction = await TransactionsFactory.createEncryptedTransaction(
          transactionData,
          channelKey,
        );

        channelEncryptionMethod = encryptionMethod;
      }
    }

    const persistResult = await this.dataAccess.persistTransaction(
      transaction,
      channelId,
      // add the hash to the topics
      topics.concat([hash]),
    );

    // Create the return result with EventEmitter
    const result: TransactionTypes.IReturnPersistTransaction = Object.assign(new EventEmitter(), {
      meta: {
        dataAccessMeta: persistResult.meta,
        encryptionMethod: channelEncryptionMethod,
      },
      result: {},
    });

    // When receive the confirmation from data-access propagate to the higher layer
    persistResult
      .on('confirmed', (resultPersistTransaction: DataAccessTypes.IReturnPersistTransaction) => {
        const resultAfterConfirmation = {
          meta: {
            dataAccessMeta: resultPersistTransaction.meta,
            encryptionMethod: channelEncryptionMethod,
          },
          result: {},
        };

        // propagate the confirmation
        result.emit('confirmed', resultAfterConfirmation);
      })
      .on('error', error => {
        result.emit('error', error);
      });

    return result;
  }

  /**
   * Gets a list of transactions from a channel
   *
   * later it will handle decryption
   *
   * @param channelId channel id to retrieve the transactions from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   * @returns list of transactions of the channel
   */
  public async getTransactionsByChannelId(
    channelId: string,
    timestampBoundaries?: TransactionTypes.ITimestampBoundaries,
  ): Promise<TransactionTypes.IReturnGetTransactions> {
    const resultGetTx = await this.dataAccess.getTransactionsByChannelId(
      channelId,
      timestampBoundaries,
    );

    // Decrypts and cleans the channel from the data-access layers
    const {
      transactions,
      ignoredTransactions,
      encryptionMethod,
    } = await this.channelParser.decryptAndCleanChannel(channelId, resultGetTx.result.transactions);

    const meta = {
      dataAccessMeta: resultGetTx.meta,
      encryptionMethod,
      ignoredTransactions,
    };

    // Remove encryptionMethod from meta if it's undefined
    // to make it clearer the channel is not encrypted.
    if (!encryptionMethod) {
      delete meta.encryptionMethod;
    }

    return {
      meta,
      result: { transactions },
    };
  }

  /**
   * Gets a list of channels indexed by topic
   *
   * @param topic topic to retrieve the channels from
   * @param updatedBetween filter the channel whose received new data in the boundaries
   * @returns list of channels indexed by topic
   */
  public async getChannelsByTopic(
    topic: string,
    updatedBetween?: TransactionTypes.ITimestampBoundaries,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    const resultGetTx = await this.dataAccess.getChannelsByTopic(topic, updatedBetween);

    return this.parseMultipleChannels(resultGetTx);
  }

  /**
   * Gets a list of channels indexed by topics
   *
   * @param topics topics to retrieve the channels from
   * @param updatedBetween filter the channel whose hasn't received new data in the boundaries
   * @returns list of channels indexed by topics
   */
  public async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: TransactionTypes.ITimestampBoundaries,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    const resultGetTx = await this.dataAccess.getChannelsByMultipleTopics(topics, updatedBetween);

    return this.parseMultipleChannels(resultGetTx);
  }

  /**
   * Parses the return of getChannels function from data-access layer
   *
   * @param resultGetTx returned value from getChannels function
   * @returns decrypted and cleaned channels in the right format
   */
  private async parseMultipleChannels(
    resultGetTx: DataAccessTypes.IReturnGetChannelsByTopic,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    // Get the channels from the data-access layers to decrypt and clean them one by one
    const result = await Object.keys(resultGetTx.result.transactions).reduce(
      async (accumulatorPromise, channelId) => {
        const cleaned = await this.channelParser.decryptAndCleanChannel(
          channelId,
          resultGetTx.result.transactions[channelId],
        );

        // await for the accumulator promise at the end to parallelize the calls to decryptAndCleanChannel()
        const accumulator: any = await accumulatorPromise;

        accumulator.transactions[channelId] = cleaned.transactions;
        accumulator.ignoredTransactions[channelId] = cleaned.ignoredTransactions;
        return accumulator;
      },
      Promise.resolve({ transactions: {}, ignoredTransactions: {} }),
    );

    return {
      meta: {
        dataAccessMeta: resultGetTx.meta,
        ignoredTransactions: result.ignoredTransactions,
      },
      result: { transactions: result.transactions },
    };
  }
}
