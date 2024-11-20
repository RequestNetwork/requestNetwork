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
    if (pageSize !== undefined && pageSize < 1) {
      throw new Error(`Page size must be greater than 0, but it is ${pageSize}`);
    }

    // Get pending items
    const pending = this.pendingStore?.findByTopics(topics) || [];

    // Map pending items to the desired format
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

    // Fetch transactions from storage
    const result = await this.storage.getTransactionsByTopics(
      topics,
      adjustedPage,
      adjustedPageSize,
    );

    // Combine and filter transactions
    let allTransactions = [...pendingItems, ...result.transactions];
    if (updatedBetween) {
      allTransactions = allTransactions.filter(
        (tx) =>
          tx.blockTimestamp >= (updatedBetween.from || 0) &&
          tx.blockTimestamp <= (updatedBetween.to || Number.MAX_SAFE_INTEGER),
      );
    }

    // Initialize data structures
    const transactionsByChannelIds: DataAccessTypes.ITransactionsByChannelIds = {};
    const storageMeta: Record<string, StorageTypes.IEntryMetadata[]> = {};
    const transactionsStorageLocation: Record<string, string[]> = {};

    // Process transactions
    for (const tx of allTransactions) {
      if (!transactionsByChannelIds[tx.channelId]) {
        transactionsByChannelIds[tx.channelId] = [];
        storageMeta[tx.channelId] = [];
        transactionsStorageLocation[tx.channelId] = [];
      }

      transactionsByChannelIds[tx.channelId].push(this.toTimestampedTransaction(tx));

      // Only add storage metadata for transactions fetched from storage
      if (result.transactions.includes(tx)) {
        storageMeta[tx.channelId].push(this.toStorageMeta(tx, result.blockNumber, this.network));
      }
      transactionsStorageLocation[tx.channelId].push(tx.hash);
    }

    // Construct the return object
    return {
      meta: {
        storageMeta,
        transactionsStorageLocation,
        pagination:
          page && pageSize
            ? {
                total: result.transactions.length,
                page,
                pageSize,
                hasMore:
                  (page - 1) * pageSize + allTransactions.length - pendingItemsOnCurrentPage <
                  result.transactions.length,
              }
            : undefined,
      },
      result: {
        transactions: transactionsByChannelIds,
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
