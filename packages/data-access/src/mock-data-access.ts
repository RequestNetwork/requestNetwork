import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { DataAccessWrite } from './data-write';
import { DataAccessRead } from './data-read';
import { PendingStore } from './pending-store';
import Block from './block';

class ArrayMap<T> extends Map<string, T[]> {
  add(key: string, value: T) {
    return this.set(key, this.get(key).concat(value));
  }
  get(key: string) {
    return super.get(key) || [];
  }
}

class DataIndex implements StorageTypes.IIndexer {
  // channelId => location[]
  private readonly locationIndex = new ArrayMap<string>();
  // topic => channelId[]
  private readonly topicIndex = new ArrayMap<string>();
  // confirmed locations
  private readonly confirmedLocations = new Set<string>();

  constructor(private readonly storageRead: StorageTypes.IStorageRead) {}

  async initialize(): Promise<void> {
    return;
  }

  async getTransactionsByStorageLocation(
    hash: string,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    const transactions = await this.parseDocuments([hash]);
    return {
      blockNumber: 0,
      transactions,
    };
  }

  async getTransactionsByChannelId(
    channelId: string,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    const locations = this.locationIndex.get(channelId);
    const transactions = await this.parseDocuments(locations);
    return {
      blockNumber: 0,
      transactions: transactions.filter((x) => x.channelId === channelId),
    };
  }

  async getTransactionsByTopics(topics: string[]): Promise<StorageTypes.IGetTransactionsResponse> {
    console.log(topics);
    throw new Error('');
  }

  index(channelId: string, topics: string[], location: string) {
    this.locationIndex.add(channelId, location);
    for (const topic of topics || []) {
      this.topicIndex.add(topic, channelId);
    }
  }
  confirm(location: string) {
    this.confirmedLocations.add(location);
  }

  private async parseDocuments(locations: string[]) {
    const entries = await this.storageRead.readMany(locations);
    return entries
      .filter((x) => x.meta.state === StorageTypes.ContentState.CONFIRMED)
      .map((curr) => {
        const { id, meta, content } = curr;
        const block = Block.parseBlock(content);
        return Object.entries(block.header.channelIds).map(([channelId, [index]]) => ({
          locationId: id,
          channelId,
          meta,
          transaction: block.transactions[index],
        }));
      })
      .flat()
      .map(
        (item): StorageTypes.IIndexedTransaction => ({
          blockNumber: 0,
          blockTimestamp: 0,
          channelId: item.channelId,
          hash: item.locationId,
          size: '0',
          smartContractAddress: '',
          topics: [],
          transactionHash: '',
          data: item.transaction.data,
          encryptedData: item.transaction.encryptedData,
          encryptionMethod: item.transaction.encryptionMethod,
          keys: item.transaction.keys || {},
        }),
      );
  }
}

/**
 * Mock Data access that bypasses the initialization.
 * This class is meant to be used with HttpRequestNetwork and useMockStorage=true.
 * Data-access initialization is asynchronous and this class is a hack to avoid having an asynchronous operation in the HttpRequestNetwork constructor.
 */
export class MockDataAccess implements DataAccessTypes.IDataAccess {
  private readonly dataWrite: DataAccessWrite;
  private readonly dataRead: DataAccessRead;
  private readonly dataIndex: DataIndex;

  constructor(storage: StorageTypes.IStorage) {
    this.dataIndex = new DataIndex(storage);
    const pendingStore = new PendingStore();
    this.dataWrite = new DataAccessWrite(storage, pendingStore);
    this.dataRead = new DataAccessRead(this.dataIndex, { network: 'mock', pendingStore });
  }

  async initialize(): Promise<void> {
    return;
  }
  async close(): Promise<void> {
    return;
  }
  async getTransactionsByChannelId(
    channelId: string,
    updatedBetween: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    return await this.dataRead.getTransactionsByChannelId(channelId, updatedBetween);
  }

  async getChannelsByTopic(topic: string): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    console.log(topic);
    return {
      meta: {
        transactionsStorageLocation: {},
        storageMeta: {},
      },
      result: {
        transactions: {},
      },
    };
  }
  async getChannelsByMultipleTopics(): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    console.log('getChannelsByMultipleTopics');
    throw new Error('Method not implemented.');
  }

  async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const result = await this.dataWrite.persistTransaction(transactionData, channelId, topics);

    this.dataIndex.index(channelId, topics || [], result.meta.transactionStorageLocation);

    return result;
  }

  async _getStatus(): Promise<any> {
    return {};
  }
}
