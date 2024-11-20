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
      throw new Error(`Page number must be greater than or equal to 1, but it is ${page}`);
    }
    if (pageSize !== undefined && pageSize <= 0) {
      throw new Error(`Page size must be positive, but it is ${pageSize}`);
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
    let pendingItemsOnCurrentPage = 0;
    if (page !== undefined && pageSize !== undefined) {
      const totalPending = pendingItems.length;
      const itemsPerPage = (page - 1) * pageSize;

      if (totalPending > itemsPerPage) {
        adjustedPage = 1;
        adjustedPageSize = pageSize - Math.min(totalPending - itemsPerPage, pageSize);
        pendingItemsOnCurrentPage = pageSize - adjustedPageSize;
      } else {
        adjustedPage = page - Math.floor(totalPending / pageSize);
      }
    }

    // Fetch transactions from storage with adjusted pagination
    const result = await this.storage.getTransactionsByTopics(
      topics,
      adjustedPage,
      adjustedPageSize,
    );

    // Combine pending and stored transactions
    let transactions = [...pendingItems, ...result.transactions];

    // Apply updatedBetween filter (if provided) before further processing
    if (updatedBetween) {
      transactions = transactions.filter(
        (tx) =>
          tx.blockTimestamp >= (updatedBetween.from || 0) &&
          tx.blockTimestamp <= (updatedBetween.to || Number.MAX_SAFE_INTEGER),
      );
    }

    // Group transactions by channelId
    const transactionsByChannelIds: DataAccessTypes.ITransactionsByChannelIds = {};
    const storageMeta: Record<string, StorageTypes.IEntryMetadata[]> = {};
    const transactionsStorageLocation: Record<string, string[]> = {};

    for (const tx of transactions) {
      if (!transactionsByChannelIds[tx.channelId]) {
        transactionsByChannelIds[tx.channelId] = [];
        storageMeta[tx.channelId] = [];
        transactionsStorageLocation[tx.channelId] = [];
      }
      transactionsByChannelIds[tx.channelId].push(this.toTimestampedTransaction(tx));
      storageMeta[tx.channelId].push(this.toStorageMeta(tx, result.blockNumber, this.network));
      transactionsStorageLocation[tx.channelId].push(tx.hash);
    }

    return {
      meta: {
        storageMeta: storageMeta,
        transactionsStorageLocation: transactionsStorageLocation,
        pagination:
          page && pageSize
            ? {
                total: result.transactions.length, // Use the actual count from storage
                page,
                pageSize,
                hasMore:
                  (page - 1) * pageSize + transactions.length - pendingItemsOnCurrentPage <
                  result.transactions.length, // Adjust hasMore calculation
              }
            : undefined,
      },
      result: {
        transactions: transactionsByChannelIds,
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
