import { DataAccess as DataAccessTypes, Transaction as Types } from '@requestnetwork/types';

import TransactionCore from './transaction';

/**
 * Implementation of TransactionManager layer without encryption
 */
export default class TransactionManager implements Types.ITransactionManager {
  private dataAccess: DataAccessTypes.IDataAccess;

  public constructor(dataAccess: DataAccessTypes.IDataAccess) {
    this.dataAccess = dataAccess;
  }

  /**
   * Function to persist transaction and topic in storage
   *
   * later it will handle encryption
   *
   * @param transactionData transaction to persist
   * @param channelId string to identify a bunch of transaction
   * @param topics list of string to topic the transaction
   *
   * @returns string dataId where the transaction is stored
   */
  public async persistTransaction(
    transactionData: Types.ITransactionData,
    channelId: string,
    topics: string[] = [],
  ): Promise<Types.IReturnPersistTransaction> {
    const transaction: Types.ITransaction = TransactionCore.createTransaction(transactionData);

    const resultPersist = await this.dataAccess.persistTransaction(transaction, channelId, topics);

    return {
      meta: {
        dataAccessMeta: resultPersist.meta,
      },
      result: {},
    };
  }

  /**
   * Function to get a list of transactions from a channel
   *
   * later it will handle decryption
   *
   * @param channelId channel id to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   * @returns list of transactions of the channel
   */
  public async getTransactionsByChannelId(
    channelId: string,
    timestampBoundaries?: Types.ITimestampBoundaries,
  ): Promise<Types.IReturnGetTransactions> {
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
   * Function to get a list of transactions indexed by topic
   *
   * later it will handle decryption
   *
   * @param topic topic to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   * @returns list of transactions indexed by topic
   */
  public async getTransactionsByTopic(
    topic: string,
    timestampBoundaries?: Types.ITimestampBoundaries,
  ): Promise<Types.IReturnGetTransactions> {
    const resultGetTx = await this.dataAccess.getTransactionsByTopic(topic, timestampBoundaries);

    return {
      meta: {
        dataAccessMeta: resultGetTx.meta,
      },
      result: resultGetTx.result,
    };
  }
}
