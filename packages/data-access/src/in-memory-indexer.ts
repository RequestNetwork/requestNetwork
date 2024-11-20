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

  async getTransactionsByTopics(
    topics: string[],
    page?: number,
    pageSize?: number,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    // Validate pagination parameters
    if (page !== undefined && page < 1) {
      throw new Error('Page must be greater than or equal to 1');
    }
    if (pageSize !== undefined && pageSize <= 0) {
      throw new Error('Page size must be greater than 0');
    }

    // Efficiently get total count without creating intermediate array
    const channelIdsSet = new Set(topics.flatMap((topic) => this.#topicToChannelsIndex.get(topic)));
    const total = channelIdsSet.size;

    // Apply pagination if requested
    let channelIds = Array.from(channelIdsSet);
    if (page !== undefined && pageSize !== undefined) {
      const start = (page - 1) * pageSize;
      // Return empty result if page exceeds available data
      if (start >= total) {
        return {
          blockNumber: 0,
          transactions: [],
          pagination: { total, page, pageSize, hasMore: false }, // Explicitly set hasMore to false
        };
      }
      channelIds = channelIds.slice(start, start + pageSize);
    }

    // Fetch and parse transactions
    const locations = channelIds.flatMap(
      (channel) => this.#channelToLocationsIndex.get(channel) || [],
    );
    const transactions = await this.parseDocuments(locations);

    // Construct the response
    return {
      blockNumber: 0,
      transactions,
      pagination:
        page !== undefined && pageSize !== undefined
          ? { total, page, pageSize, hasMore: page * pageSize < total }
          : undefined,
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
