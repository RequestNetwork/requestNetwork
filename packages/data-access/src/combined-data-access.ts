import { DataAccessTypes } from '@requestnetwork/types';

export abstract class CombinedDataAccess implements DataAccessTypes.IDataAccess {
  constructor(
    protected reader: DataAccessTypes.IDataRead,
    protected writer: DataAccessTypes.IDataWrite,
  ) {
    this.getTransactionsByChannelId = this.reader.getTransactionsByChannelId.bind(this.reader);
    this.getChannelsByTopic = this.reader.getChannelsByTopic.bind(this.reader);
    this.getChannelsByMultipleTopics = this.reader.getChannelsByMultipleTopics.bind(this.reader);
    this.persistTransaction = this.writer.persistTransaction.bind(this.writer);
  }

  async initialize(): Promise<void> {
    await this.reader.initialize();
    await this.writer.initialize();
  }

  async close(): Promise<void> {
    await this.writer.close();
    await this.reader.close();
  }

  getTransactionsByChannelId: (
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ) => Promise<DataAccessTypes.IReturnGetTransactions>;

  getChannelsByTopic: (
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ) => Promise<DataAccessTypes.IReturnGetChannelsByTopic>;
  getChannelsByMultipleTopics: (
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ) => Promise<DataAccessTypes.IReturnGetChannelsByTopic>;
  persistTransaction: (
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ) => Promise<DataAccessTypes.IReturnPersistTransaction>;
}
