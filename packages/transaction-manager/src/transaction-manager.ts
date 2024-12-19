import * as MultiFormat from '@requestnetwork/multi-format';
import {
  CipherProviderTypes,
  DataAccessTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  StorageTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import { normalizeKeccak256Hash } from '@requestnetwork/utils';

import { EventEmitter } from 'events';

import ChannelParser from './channel-parser';
import TransactionsFactory from './transactions-factory';

/**
 * Implementation of TransactionManager layer without encryption
 */
export default class TransactionManager implements TransactionTypes.ITransactionManager {
  private dataAccess: DataAccessTypes.IDataAccess;
  private channelParser: ChannelParser;
  private cipherProvider?: CipherProviderTypes.ICipherProvider;

  public constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider,
    cipherProvider?: CipherProviderTypes.ICipherProvider,
  ) {
    this.dataAccess = dataAccess;
    this.channelParser = new ChannelParser(decryptionProvider, cipherProvider);
    this.cipherProvider = cipherProvider;
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
    const hash = MultiFormat.serialize(normalizeKeccak256Hash(JSON.parse(transactionData)));

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
          this.cipherProvider,
        );
        channelEncryptionMethod = transaction.encryptionMethod;
      }

      // Add the transaction to an existing channel
    } else {
      const resultGetTx = await this.dataAccess.getTransactionsByChannelId(channelId);

      const { channelKey, channelType, encryptionMethod } =
        await this.channelParser.getChannelTypeAndChannelKey(
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
        if (!channelKey) {
          throw new Error(`Impossible to decrypt the channel key of: ${channelId}`);
        }

        transaction = await TransactionsFactory.createEncryptedTransaction(
          transactionData,
          channelKey,
          encryptionParams,
          this.cipherProvider,
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
        transactionData: transaction,
        topics: topics.concat([hash]),
      },
      result: {},
    });

    // When receive the confirmation from data-access propagate to the higher layer
    persistResult
      .on('confirmed', (resultPersistTransaction) => {
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
      .on('error', (error) => {
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
    const { transactions, ignoredTransactions, encryptionMethod } =
      await this.channelParser.decryptAndCleanChannel(channelId, resultGetTx.result.transactions);

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
    page?: number,
    pageSize?: number,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    const resultGetTx = await this.dataAccess.getChannelsByTopic(topic, updatedBetween);

    return this.parseMultipleChannels(resultGetTx, page, pageSize);
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
    page?: number,
    pageSize?: number,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    const resultGetTx = await this.dataAccess.getChannelsByMultipleTopics(topics, updatedBetween);

    return this.parseMultipleChannels(resultGetTx, page, pageSize);
  }

  /**
   * Parses the return of getChannels function from data-access layer
   *
   * @param resultGetTx returned value from getChannels function
   * @returns decrypted and cleaned channels in the right format
   */
  private async parseMultipleChannels(
    resultGetTx: DataAccessTypes.IReturnGetChannelsByTopic,
    page?: number,
    pageSize?: number,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    // Get all channel IDs
    const allChannelIds = Object.keys(resultGetTx.result.transactions).sort();

    const result = {
      transactions: {} as Record<string, TransactionTypes.ITransaction[]>,
      ignoredTransactions: {} as Record<string, TransactionTypes.ITransaction[]>,
    };

    // Calculate starting point
    const start = page && pageSize ? (page - 1) * pageSize : 0;
    let validCount = 0;
    let currentIndex = start;

    // Keep decrypting until we have pageSize valid results or run out of channels
    while (validCount < (pageSize || allChannelIds.length) && currentIndex < allChannelIds.length) {
      // Process a larger batch to account for potential invalid results
      const batchSize = allChannelIds.length - currentIndex;
      const currentBatch = allChannelIds.slice(currentIndex, currentIndex + batchSize);

      // Process batch in parallel
      const results = await Promise.all(
        currentBatch.map(async (channelId) => {
          try {
            const cleaned = await this.channelParser.decryptAndCleanChannel(
              channelId,
              resultGetTx.result.transactions[channelId],
            );

            if (
              cleaned.transactions &&
              cleaned.transactions.length > 0 &&
              cleaned.transactions[0] !== null
            ) {
              return {
                channelId,
                cleaned,
                valid: true,
              };
            }
          } catch (error) {
            console.warn(`Failed to decrypt channel ${channelId}:`, error);
          }
          return { channelId, valid: false };
        }),
      );

      // Add valid results to our output
      for (const res of results) {
        if (
          res.valid &&
          res.cleaned &&
          validCount < (pageSize || allChannelIds.length) &&
          res.cleaned.transactions?.[0] !== null
        ) {
          if (res.cleaned.transactions[0]) {
            result.transactions[res.channelId] = res.cleaned
              .transactions as unknown as TransactionTypes.ITransaction[];
            result.ignoredTransactions[res.channelId] = res.cleaned
              .ignoredTransactions as unknown as TransactionTypes.ITransaction[];
            validCount++;
          }
        }
      }

      // If we haven't gotten enough valid results, continue with the next batch
      if (validCount < (pageSize || allChannelIds.length)) {
        currentIndex += batchSize;
      } else {
        break;
      }
    }

    // Get paginated metadata only for the successful channels
    const successfulChannelIds = Object.keys(result.transactions);
    const paginatedMeta = {
      ...resultGetTx.meta,
      storageMeta: Object.keys(resultGetTx.meta.storageMeta || {})
        .filter((key) => successfulChannelIds.includes(key))
        .reduce((acc, key) => {
          acc[key] = resultGetTx.meta.storageMeta?.[key] || [];
          return acc;
        }, {} as Record<string, StorageTypes.IEntryMetadata[]>),
      transactionsStorageLocation: Object.keys(resultGetTx.meta.transactionsStorageLocation)
        .filter((key) => successfulChannelIds.includes(key))
        .reduce((acc, key) => {
          acc[key] = resultGetTx.meta.transactionsStorageLocation[key];
          return acc;
        }, {} as Record<string, string[]>),
      pagination:
        page && pageSize
          ? {
              total: allChannelIds.length,
              page,
              pageSize,
              hasMore: currentIndex < allChannelIds.length,
            }
          : undefined,
    };

    return {
      meta: {
        dataAccessMeta: paginatedMeta,
        ignoredTransactions: result.ignoredTransactions as unknown as Record<
          string,
          TransactionTypes.IIgnoredTransaction[]
        >,
      },
      result: {
        transactions: result.transactions as unknown as Record<
          string,
          TransactionTypes.ITimestampedTransaction[]
        >,
      },
    };
  }
}
