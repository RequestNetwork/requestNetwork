import { DataAccessTypes, EncryptionTypes, TransactionTypes } from '@requestnetwork/types';

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

    return {
      meta: {
        dataAccessMeta: resultGetTx.meta,
      },
      result: resultGetTx.result,
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

    return {
      meta: {
        dataAccessMeta: resultGetTx.meta,
      },
      result: resultGetTx.result,
    };
  }
}
