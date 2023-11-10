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
  // these fields must be private (#) or jest's matcher won't work.
  readonly #channelToLocationsIndex = new ArrayMap<string>();
  readonly #topicToChannelsIndex = new ArrayMap<string>();

  constructor(private readonly storageRead: StorageTypes.IStorageRead) {}

  /** Adds the indexed data for easy retrieval */
  public addIndex(channelId: string, topics: string[], location: string): void {
    this.#channelToLocationsIndex.add(channelId, location);
    for (const topic of topics || []) {
      this.#topicToChannelsIndex.add(topic, channelId);
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
    const locations = this.#channelToLocationsIndex.get(channelId);
    const transactions = await this.parseDocuments(locations);
    return {
      blockNumber: 0,
      transactions: transactions.filter((x) => x.channelId === channelId),
    };
  }

  async getTransactionsByTopics(topics: string[]): Promise<StorageTypes.IGetTransactionsResponse> {
    const channelIds = topics.map((topic) => this.#topicToChannelsIndex.get(topic)).flat();
    const locations = channelIds
      .map((channel) => this.#channelToLocationsIndex.get(channel))
      .flat();

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
          blockNumber: item.meta.ethereum?.blockNumber ?? 0,
          blockTimestamp: item.meta.ethereum?.blockTimestamp ?? 0,
          channelId: item.channelId,
          hash: item.locationId,
          size: String(item.meta.ipfs?.size ?? 0),
          smartContractAddress: item.meta.ethereum?.smartContractAddress ?? '',
          topics: [],
          transactionHash: item.meta.ethereum?.transactionHash ?? '',
          data: item.transaction.data,
          encryptedData: item.transaction.encryptedData,
          encryptionMethod: item.transaction.encryptionMethod,
          keys: item.transaction.keys,
        }),
      );
  }
}
