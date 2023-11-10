import { DataAccessTypes } from '@requestnetwork/types';

export abstract class CombinedDataAccess implements DataAccessTypes.IDataAccess {
  constructor(
    protected reader: DataAccessTypes.IDataRead,
    protected writer: DataAccessTypes.IDataWrite,
  ) {}

  async initialize(): Promise<void> {
    await this.reader.initialize();
    await this.writer.initialize();
  }

  async close(): Promise<void> {
    await this.writer.close();
    await this.reader.close();
  }

  async getTransactionsByChannelId(
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    return await this.reader.getTransactionsByChannelId(channelId, updatedBetween);
  }

  async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return await this.reader.getChannelsByTopic(topic, updatedBetween);
  }
  async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return await this.reader.getChannelsByMultipleTopics(topics, updatedBetween);
  }
  async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    return await this.writer.persistTransaction(transactionData, channelId, topics);
  }
}
