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
    page?: number | undefined,
    pageSize?: number | undefined,
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
    if (pageSize !== undefined && pageSize < 1) {
      throw new Error(`Page size must be greater than 0, but it is ${pageSize}`);
    }

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

    // Calculate adjusted pagination
    let adjustedPage = page;
    let adjustedPageSize = pageSize;
    let pendingItemsOnCurrentPage = 0;
    if (page !== undefined && pageSize !== undefined) {
      const totalPending = pendingItems.length;
      const itemsPerPage = (page - 1) * pageSize;

      if (totalPending > itemsPerPage) {
        pendingItemsOnCurrentPage = Math.min(totalPending - itemsPerPage, pageSize);
        adjustedPageSize = pageSize - pendingItemsOnCurrentPage;
        adjustedPage = 1;
        if (adjustedPageSize === 0) {
          adjustedPageSize = 1;
          pendingItemsOnCurrentPage--;
        }
      } else {
        adjustedPage = page - Math.floor(totalPending / pageSize);
      }
    }

    const result = await this.storage.getTransactionsByTopics(
      topics,
      adjustedPage,
      adjustedPageSize,
    );

    const transactions = result.transactions.concat(...pendingItems);

    // Apply timestamp filtering FIRST
    const filteredTransactions = updatedBetween
      ? transactions.filter(
          (tx) =>
            tx.blockTimestamp >= (updatedBetween.from || 0) &&
            tx.blockTimestamp <= (updatedBetween.to || Number.MAX_SAFE_INTEGER),
        )
      : transactions;

    // Then get unique channels from filtered transactions
    const channels = [...new Set(filteredTransactions.map((x) => x.channelId))];

    // Get all transactions for these channels
    const filteredTxs = transactions.filter((tx) => channels.includes(tx.channelId));

    // Apply pagination to the filtered results
    const start = ((page || 1) - 1) * (pageSize || filteredTxs.length);
    const end = start + (pageSize || filteredTxs.length);
    const paginatedTxs = filteredTxs.slice(start, end);

    return {
      meta: {
        storageMeta: paginatedTxs.reduce((acc, tx) => {
          acc[tx.channelId] = [this.toStorageMeta(tx, result.blockNumber, this.network)];
          return acc;
        }, {} as Record<string, StorageTypes.IEntryMetadata[]>),
        transactionsStorageLocation: paginatedTxs.reduce((prev, curr) => {
          if (!prev[curr.channelId]) {
            prev[curr.channelId] = [];
          }
          prev[curr.channelId].push(curr.hash);
          return prev;
        }, {} as Record<string, string[]>),
        pagination:
          page && pageSize
            ? {
                total: filteredTxs.length,
                page,
                pageSize,
                hasMore: end < filteredTxs.length,
              }
            : undefined,
      },
      result: {
        transactions: paginatedTxs.reduce((prev, curr) => {
          if (!prev[curr.channelId]) {
            prev[curr.channelId] = [];
          }
          prev[curr.channelId].push(this.toTimestampedTransaction(curr));
          return prev;
        }, {} as DataAccessTypes.ITransactionsByChannelIds),
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
