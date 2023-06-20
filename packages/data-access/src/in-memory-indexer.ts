import { StorageTypes } from '@requestnetwork/types';
import Block from './block';

/** Helper class to manage a map with arrays as values */
class ArrayMap<T> extends Map<string, T[]> {
  add(key: string, value: T) {
    return this.set(key, this.get(key).concat(value));
  }
  get(key: string) {
    return super.get(key) || [];
  }
}

/**
 * InMemory implementation to index Request storage transactions, for testing and development.
 * The data itself is not indexed, only references to its location
 */
export class InMemoryIndexer implements StorageTypes.IIndexer {
  /** channelId => location[] */
  private readonly locationIndex = new ArrayMap<string>();
  /** topic => channelId[] */
  private readonly topicIndex = new ArrayMap<string>();

  constructor(private readonly storageRead: StorageTypes.IStorageRead) {}

  /** Adds the indexed data for easy retrieval */
  public addIndex(channelId: string, topics: string[], location: string): void {
    this.locationIndex.add(channelId, location);
    for (const topic of topics || []) {
      this.topicIndex.add(topic, channelId);
    }
  }

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
    const channelIds = topics.map(this.topicIndex.get).flat();
    const locations = channelIds.map(this.locationIndex.get).flat();
    const transactions = await this.parseDocuments(locations);

    return {
      blockNumber: 0,
      transactions,
    };
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
