import {
  DataAccessTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  TransactionTypes,
} from '@requestnetwork/types';

import TransactionsFactory from './transactions-factory';
import TransactionsParser from './transactions-parser';

/**
 * Implementation of TransactionManager layer without encryption
 */
export default class TransactionManager implements TransactionTypes.ITransactionManager {
  private dataAccess: DataAccessTypes.IDataAccess;
  private transactionParser: TransactionsParser;

  public constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider,
  ) {
    this.dataAccess = dataAccess;
    this.transactionParser = new TransactionsParser(decryptionProvider);
  }

  /**
   * Persists a clear transaction and topic in storage
   *
   * @param transactionData transaction to persist
   * @param channelId string to identify a group of transactions
   * @param topics list of string to topic the transaction
   *
   * @returns object containing the meta-data of the persist
   */
  public async persistTransaction(
    transactionData: TransactionTypes.ITransactionData,
    channelId: string,
    topics: string[] = [],
  ): Promise<TransactionTypes.IReturnPersistTransaction> {
    const transaction: TransactionTypes.IPersistedTransaction = await TransactionsFactory.createClearTransaction(
      transactionData,
    );

    const persistResult = await this.dataAccess.persistTransaction(transaction, channelId, topics);

    return {
      meta: {
        dataAccessMeta: persistResult.meta,
      },
      result: {},
    };
  }

  /**
   * Encrypts and persists a transaction and topics in storage
   *
   * @param transactionData transaction to persist
   * @param channelId string to identify a group of transactions
   * @param encryptionParams list of encryption parameters to encrypt the channel key with
   * @param topics list of string to topic the transaction
   *
   * @returns object containing the meta-data of the persist
   */
  public async persistEncryptedTransaction(
    transactionData: TransactionTypes.ITransactionData,
    channelId: string,
    encryptionParams: EncryptionTypes.IEncryptionParameters[],
    topics: string[] = [],
  ): Promise<TransactionTypes.IReturnPersistTransaction> {
    const encryptedTransaction: TransactionTypes.IPersistedTransaction = await TransactionsFactory.createEncryptedTransaction(
      transactionData,
      encryptionParams,
    );

    const persistResult = await this.dataAccess.persistTransaction(
      encryptedTransaction,
      channelId,
      topics,
    );

    return {
      meta: {
        dataAccessMeta: persistResult.meta,
        encryptionMethod: encryptedTransaction.encryptionMethod,
      },
      result: {},
    };
  }

  /**
   * Gets a list of transactions from a channel
   *
   * later it will handle decryption
   *
   * @param channelId channel id to retrieve the transaction from
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

    // Decrypts and clean the channel from the data-access layers
    const { transactions, ignoredTransactions } = await this.decryptAndCleanChannel(
      channelId,
      resultGetTx.result.transactions,
    );

    return {
      meta: {
        dataAccessMeta: resultGetTx.meta,
        ignoredTransactions,
      },
      result: { transactions },
    };
  }

  /**
   * Gets a list of channels indexed by topic
   *
   * @param topic topic to retrieve the transaction from
   * @param updatedBetween filter the channel whose received new data in the boundaries
   * @returns list of channels indexed by topic
   */
  public async getChannelsByTopic(
    topic: string,
    updatedBetween?: TransactionTypes.ITimestampBoundaries,
  ): Promise<TransactionTypes.IReturnGetTransactionsByChannels> {
    const resultGetTx = await this.dataAccess.getChannelsByTopic(topic, updatedBetween);

    // Get the channels from the data-access layers to decrypt and clean them one by one
    const result = await Object.keys(resultGetTx.result.transactions).reduce(
      async (accumulatorPromise, channelId) => {
        const cleaned = await this.decryptAndCleanChannel(
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

  /**
   * Decrypts and cleans a channel by removing the wrong transactions
   *
   * @param channelId the channelId of the channel
   * @param transactions the transactions of the channel to decrypt and clean
   * @returns Promise resolving the kept transactions and the ignored ones with the reason
   */
  private async decryptAndCleanChannel(
    channelId: string,
    transactions: TransactionTypes.IConfirmedTransaction[],
  ): Promise<{
    transactions: Array<TransactionTypes.IConfirmedTransaction | null>;
    ignoredTransactions: Array<TransactionTypes.IIgnoredTransaction | null>;
  }> {
    let channelType: TransactionTypes.ChannelType = TransactionTypes.ChannelType.UNKNOWN;
    let channelKey: EncryptionTypes.IDecryptionParameters | undefined;

    interface IValidAndIgnoredTransactions {
      valid: TransactionTypes.IConfirmedTransaction | null;
      ignored: TransactionTypes.IIgnoredTransaction | null;
    }

    // use of .reduce instead of .map to keep a sequential execution
    const validAndIgnoredTransactions: IValidAndIgnoredTransactions[] = await transactions.reduce(
      async (
        accumulatorPromise: Promise<IValidAndIgnoredTransactions[]>,
        confirmedTransaction: TransactionTypes.IConfirmedTransaction,
      ) => {
        const result = await accumulatorPromise;

        let parsedTransactionAndChannelKey;
        try {
          // Parse the transaction from data-access to get a transaction object and the channel key if encrypted
          parsedTransactionAndChannelKey = await this.transactionParser.parsePersistedTransaction(
            confirmedTransaction.transaction,
            channelType,
            channelKey,
          );
        } catch (error) {
          return result.concat([
            {
              ignored: {
                reason: error.message,
                transaction: confirmedTransaction,
              },
              valid: null,
            },
          ]);
        }

        const transaction: TransactionTypes.ITransaction =
          parsedTransactionAndChannelKey.transaction;

        // We check if the transaction is valid
        const error = await transaction.getError();
        if (error !== '') {
          return result.concat([
            {
              ignored: {
                reason: error,
                transaction: confirmedTransaction,
              },
              valid: null,
            },
          ]);
        }

        // If this is the first transaction, it removes the transaction if the hash is not the same as the channelId
        if (channelType === TransactionTypes.ChannelType.UNKNOWN) {
          const hash = await transaction.getHash();
          if (hash !== channelId) {
            return result.concat([
              {
                ignored: {
                  reason:
                    'as first transaction, the hash of the transaction do not match the channelId',
                  transaction: confirmedTransaction,
                },
                valid: null,
              },
            ]);
          }
          // from the first valid transaction, we can deduce the type of the channel
          channelType = !!parsedTransactionAndChannelKey.channelKey
            ? TransactionTypes.ChannelType.ENCRYPTED
            : TransactionTypes.ChannelType.CLEAR;

          // we keep the channelKey for this channel
          channelKey = parsedTransactionAndChannelKey.channelKey;
        }

        const data = await transaction.getData();

        // add the decrypted transaction as valid
        return result.concat([
          {
            ignored: null,
            valid: { transaction: { data }, timestamp: confirmedTransaction.timestamp },
          },
        ]);
      },
      Promise.resolve([]),
    );

    const ignoredTransactions: Array<TransactionTypes.IIgnoredTransaction | null> = validAndIgnoredTransactions.map(
      (elem: any) => elem.ignored,
    );

    const cleanedTransactions: Array<TransactionTypes.IConfirmedTransaction | null> = validAndIgnoredTransactions.map(
      (elem: any) => elem.valid,
    );

    // The cleaned result
    return {
      ignoredTransactions,
      transactions: cleanedTransactions,
    };
  }
}
