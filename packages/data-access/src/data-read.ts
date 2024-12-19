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
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return this.getChannelsByMultipleTopics([topic], updatedBetween);
  }

  async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
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

    // Get stored transactions
    const result = await this.storage.getTransactionsByTopics(topics);

    // Combine and sort all transactions
    const allTransactions = [...result.transactions, ...pendingItems].sort(
      (a, b) => a.blockTimestamp - b.blockTimestamp,
    );

    // Apply time boundaries filter
    const filteredTransactions = updatedBetween
      ? allTransactions.filter(
          (tx) =>
            tx.blockTimestamp >= (updatedBetween.from || 0) &&
            tx.blockTimestamp <= (updatedBetween.to || Number.MAX_SAFE_INTEGER),
        )
      : allTransactions;

    // Group by channel ID
    const transactionsByChannel = filteredTransactions.reduce((prev, curr) => {
      if (!prev[curr.channelId]) {
        prev[curr.channelId] = [];
      }
      prev[curr.channelId].push(this.toTimestampedTransaction(curr));
      return prev;
    }, {} as DataAccessTypes.ITransactionsByChannelIds);

    const storageMeta = filteredTransactions.reduce((acc, tx) => {
      if (!acc[tx.channelId]) {
        acc[tx.channelId] = [this.toStorageMeta(tx, result.blockNumber, this.network)];
      }
      return acc;
    }, {} as Record<string, StorageTypes.IEntryMetadata[]>);

    const storageLocations = filteredTransactions.reduce((prev, curr) => {
      if (!prev[curr.channelId]) {
        prev[curr.channelId] = [];
      }
      prev[curr.channelId].push(curr.hash);
      return prev;
    }, {} as Record<string, string[]>);

    return {
      meta: {
        storageMeta,
        transactionsStorageLocation: storageLocations,
      },
      result: {
        transactions: transactionsByChannel,
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
