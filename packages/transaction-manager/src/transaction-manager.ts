import { DataAccessTypes, EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import TransactionCore from './transaction';

/**
 * Implementation of TransactionManager layer without encryption
 */
export default class TransactionManager implements TransactionTypes.ITransactionManager {
  private dataAccess: DataAccessTypes.IDataAccess;

  public constructor(dataAccess: DataAccessTypes.IDataAccess) {
    this.dataAccess = dataAccess;
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
    const transaction: TransactionTypes.ITransaction = TransactionCore.createTransaction(
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
    const encryptedTransaction: TransactionTypes.ITransaction = await TransactionCore.createEncryptedTransaction(
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

    // Clean the channel from the data-access layers
    const { transactions, ignoredTransactions } = await this.cleanChannel(
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

    // Clean the channels from the data-access layers one by one
    const result = await Object.keys(resultGetTx.result.transactions).reduce(
      async (accumulatorPromise, channelId) => {
        const cleaned = await this.cleanChannel(
          channelId,
          resultGetTx.result.transactions[channelId],
        );

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
   * Clean a channel by removing the wrong transactions
   *
   * @param channelId the channelId of the channel
   * @param transactions the transactions of the channel
   * @returns Promise resolving the kept transactions and the ignored transactions
   */
  private async cleanChannel(
    channelId: string,
    transactions: TransactionTypes.IConfirmedTransaction[],
  ): Promise<{
    transactions: Array<TransactionTypes.IConfirmedTransaction | null>;
    ignoredTransactions: Array<TransactionTypes.IIgnoredTransaction | null>;
  }> {
    let firstValidTxFound: boolean = false;
    const validAndIgnoredTransactions = transactions.map(
      (
        confirmedTransaction: TransactionTypes.IConfirmedTransaction,
      ): {
        valid: TransactionTypes.IConfirmedTransaction | null;
        ignored: TransactionTypes.IIgnoredTransaction | null;
      } => {
        const transaction = confirmedTransaction.transaction;

        // Recursively remove the first transaction if the hash is not the same as the channelId and for clear transaction if the transaction data is not parsable
        if (!firstValidTxFound) {
          let isFirstTransactionValid: boolean = false;
          try {
            isFirstTransactionValid =
              Utils.crypto.normalizeKeccak256Hash(JSON.parse(transaction.data)) === channelId;
          } catch (e) {
            // if the transaction data are not parsable (in a clear transaction)
            return {
              ignored: {
                reason: 'Impossible to JSON parse the transaction',
                transaction: confirmedTransaction,
              },
              valid: null,
            };
          }

          if (!isFirstTransactionValid) {
            return {
              ignored: {
                reason:
                  'as first transaction, the hash of the transaction do not match the channelId',
                transaction: confirmedTransaction,
              },
              valid: null,
            };
          }
          firstValidTxFound = true;
          return { valid: confirmedTransaction, ignored: null };
        }

        // We check that the transaction data are parsable
        try {
          JSON.parse(transaction.data);
        } catch (e) {
          return {
            ignored: {
              reason: 'Impossible to JSON parse the transaction',
              transaction: confirmedTransaction,
            },
            valid: null,
          };
        }

        // No other check yet
        return { valid: confirmedTransaction, ignored: null };
      },
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
