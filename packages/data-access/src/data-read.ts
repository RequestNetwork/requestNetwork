import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { DataAccessBaseOptions } from './types';

export class DataAccessRead implements DataAccessTypes.IDataRead {
  private network: string;

  private pendingStore?: DataAccessTypes.IPendingStore;

  constructor(
    private readonly storage: StorageTypes.IIndexer,
    { network, pendingStore }: DataAccessBaseOptions,
  ) {
    this.network = network;
    this.pendingStore = pendingStore;
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  async getTransactionsByChannelId(
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const pending = await this.getPending(channelId);
    const result = await this.storage.getTransactionsByChannelId(channelId, updatedBetween);

    return {
      meta: {
        transactionsStorageLocation: result.transactions
          .map((x) => x.hash)
          .concat(pending.meta.transactionsStorageLocation),
        storageMeta: result.transactions.map((tx) =>
          this.toStorageMeta(tx, result.blockNumber, this.network),
        ),
      },
      result: {
        transactions: result.transactions
          .map(this.toTimestampedTransaction)
          .concat(pending.result.transactions),
      },
    };
  }

  async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
    page?: number,
    pageSize?: number,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return this.getChannelsByMultipleTopics([topic], updatedBetween, page, pageSize);
  }

  async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
    page?: number,
    pageSize?: number,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    // Validate pagination parameters
    if (page !== undefined && page < 1) {
      throw new Error(`Page number must be greater than or equal to 1 but it is ${page}`);
    }
    if (pageSize !== undefined && pageSize <= 0) {
      throw new Error(`Page size must be positive but it is ${pageSize}`);
    }

    // Get pending items first
    const pending = this.pendingStore?.findByTopics(topics) || [];
    const pendingItems = pending.map((item) => ({
      hash: item.storageResult.id,
      channelId: item.channelId,
      ...item.transaction,

      blockNumber: item.storageResult.meta.ethereum?.blockNumber || -1,
      blockTimestamp: item.storageResult.meta.ethereum?.blockTimestamp || -1,
      transactionHash: item.storageResult.meta.ethereum?.transactionHash || '',
      smartContractAddress: item.storageResult.meta.ethereum?.smartContractAddress || '',
      size: String(item.storageResult.meta.ipfs?.size || 0),
      topics: item.topics || [],
    }));

    // Adjust pagination to account for pending items
    let adjustedPage = page;
    let adjustedPageSize = pageSize;
    if (page !== undefined && pageSize !== undefined) {
      if (pendingItems.length >= (page - 1) * pageSize) {
        // If pending items fill previous pages
        adjustedPage = 0;
        adjustedPageSize = 0;
      } else {
        // Adjust page size to account for pending items included
        const pendingItemsInPreviousPages = Math.min(pendingItems.length, (page - 1) * pageSize);
        const pendingItemsInCurrentPage = Math.min(
          pendingItems.length - pendingItemsInPreviousPages,
          pageSize,
        );
        adjustedPageSize = pageSize - pendingItemsInCurrentPage;
        adjustedPage = Math.floor(
          ((page - 1) * pageSize - pendingItemsInPreviousPages) / adjustedPageSize,
        );
      }
    }

    // Fetch transactions from storage with adjusted pagination
    const result = await this.storage.getTransactionsByTopics(
      topics,
      adjustedPage,
      adjustedPageSize,
    );

    // Combine pending and stored transactions
    const transactions = [...pendingItems, ...result.transactions];

    // Proceed with filtering and mapping as per existing logic
    const filteredTxs = transactions.filter((tx) => {
      if (!updatedBetween) return true;
      return (
        tx.blockTimestamp >= (updatedBetween.from || 0) &&
        tx.blockTimestamp <= (updatedBetween.to || Number.MAX_SAFE_INTEGER)
      );
    });

    const finalTransactions = filteredTxs.reduce((prev, curr) => {
      if (!prev[curr.channelId]) {
        prev[curr.channelId] = [];
      }
      prev[curr.channelId].push(this.toTimestampedTransaction(curr));
      return prev;
    }, {} as DataAccessTypes.ITransactionsByChannelIds);

    return {
      meta: {
        storageMeta: filteredTxs.reduce(
          (acc, tx) => {
            acc[tx.channelId] = [this.toStorageMeta(tx, result.blockNumber, this.network)];
            return acc;
          },
          {} as Record<string, StorageTypes.IEntryMetadata[]>,
        ),
        transactionsStorageLocation: filteredTxs.reduce(
          (prev, curr) => {
            if (!prev[curr.channelId]) {
              prev[curr.channelId] = [];
            }
            prev[curr.channelId].push(curr.hash);
            return prev;
          },
          {} as Record<string, string[]>,
        ),
        pagination:
          page && pageSize
            ? {
                total: filteredTxs.length,
                page,
                pageSize,
                hasMore: page * pageSize < filteredTxs.length,
              }
            : undefined,
      },
      result: {
        transactions: finalTransactions,
      },
    };
  }

  private async getPending(channelId: string): Promise<DataAccessTypes.IReturnGetTransactions> {
    const emptyResult = {
      meta: {
        transactionsStorageLocation: [],
        storageMeta: [],
      },
      result: {
        transactions: [],
      },
    };
    const pending = this.pendingStore?.get(channelId);
    if (!pending) {
      return emptyResult;
    }
    const { storageResult, transaction } = pending;

    const { transactions } = await this.storage.getTransactionsByStorageLocation(storageResult.id);

    // if the pending tx is found, remove its state and fetch the real data
    if (transactions.length > 0) {
      this.pendingStore?.remove(channelId);
      return emptyResult;
    }

    return {
      meta: {
        transactionsStorageLocation: [storageResult.id],
        storageMeta: [storageResult.meta],
      },
      result: {
        transactions: [
          {
            state: DataAccessTypes.TransactionState.PENDING,
            timestamp: storageResult.meta.timestamp,
            transaction,
          },
        ],
      },
    };
  }

  protected toStorageMeta(
    result: StorageTypes.IIndexedTransaction,
    lastBlockNumber: number,
    network: string,
  ): StorageTypes.IEntryMetadata {
    return {
      ethereum: {
        blockConfirmation: lastBlockNumber - result.blockNumber,
        blockNumber: result.blockNumber,
        blockTimestamp: result.blockTimestamp,
        networkName: network,
        smartContractAddress: result.smartContractAddress,
        transactionHash: result.transactionHash,
      },
      ipfs: {
        size: parseInt(result.size),
      },
      state: StorageTypes.ContentState.CONFIRMED,
      storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      timestamp: result.blockTimestamp,
    };
  }

  protected toTimestampedTransaction(
    transaction: StorageTypes.IIndexedTransaction,
  ): DataAccessTypes.ITimestampedTransaction {
    return {
      state: DataAccessTypes.TransactionState.CONFIRMED,
      timestamp: transaction.blockTimestamp,
      transaction: {
        data: transaction.data || undefined,
        encryptedData: transaction.encryptedData || undefined,
        encryptionMethod: transaction.encryptionMethod || undefined,
        keys: transaction.keys || undefined,
      },
    };
  }
}
