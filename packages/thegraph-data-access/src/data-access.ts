import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { BigNumber } from 'ethers';

import { getCurrentTimestampInSecond, retry, SimpleLogger } from '@requestnetwork/utils';
import { Block, CombinedDataAccess } from '@requestnetwork/data-access';
import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';

import { Transaction } from './queries';
import { SubgraphClient } from './subgraph-client';
import { PendingStore } from './pending-store';
import { RequestInit } from 'graphql-request/dist/types.dom';

type TheGraphDataAccessBaseOptions = {
  network: string;
  logger?: LogTypes.ILogger;
  pendingStore?: PendingStore;
};

export type TheGraphDataAccessOptions = TheGraphDataAccessBaseOptions & {
  graphql: { url: string } & RequestInit;
  storage?: StorageTypes.IStorageWrite;
};

type DataAccessEventEmitter = TypedEmitter<{
  confirmed: (data: DataAccessTypes.IReturnPersistTransactionRaw) => void;
  error: (error: unknown) => void;
}>;

const getStorageMeta = (
  result: Transaction,
  lastBlockNumber: number,
  network: string,
): StorageTypes.IEntryMetadata => {
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
      size: BigNumber.from(result.size).toNumber(),
    },
    state: StorageTypes.ContentState.CONFIRMED,
    storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
    timestamp: result.blockTimestamp,
  };
};

export class TheGraphDataRead implements DataAccessTypes.IDataRead {
  private network: string;

  private pendingStore?: PendingStore;

  constructor(
    private readonly graphql: SubgraphClient,
    { network, pendingStore }: TheGraphDataAccessBaseOptions,
  ) {
    this.network = network;
    this.pendingStore = pendingStore;
  }

  async initialize(): Promise<void> {
    await this.graphql.getBlockNumber();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  async getTransactionsByChannelId(
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const pending = await this.getPending(channelId);

    const result = await this.graphql.getTransactionsByChannelId(channelId, updatedBetween);

    return {
      meta: {
        transactionsStorageLocation: result.transactions
          .map((x) => x.hash)
          .concat(pending.meta.transactionsStorageLocation),
        storageMeta: result.transactions.map((tx) =>
          getStorageMeta(tx, result._meta.block.number, this.network),
        ),
      },
      result: {
        transactions: result.transactions
          .map(this.getTimestampedTransaction)
          .concat(pending.result.transactions),
      },
    };
  }

  async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return this.getChannelsByMultipleTopics([topic], updatedBetween);
  }

  async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    const result = await this.graphql.getChannelsByTopics(topics);

    // list of channels having at least one tx updated during the updatedBetween boundaries
    const channels = result.transactions
      .filter(
        (tx) =>
          tx.blockTimestamp >= (updatedBetween?.from || 0) &&
          tx.blockTimestamp <= (updatedBetween?.to || Number.MAX_SAFE_INTEGER),
      )
      .map((x) => x.channelId);

    const filteredTxs = result.transactions.filter((tx) => channels.includes(tx.channelId));
    return {
      meta: {
        storageMeta: filteredTxs.reduce((acc, tx) => {
          acc[tx.channelId] = [getStorageMeta(tx, result._meta.block.number, this.network)];
          return acc;
        }, {} as Record<string, StorageTypes.IEntryMetadata[]>),
        transactionsStorageLocation: filteredTxs.reduce((prev, curr) => {
          if (!prev[curr.channelId]) {
            prev[curr.channelId] = [];
          }
          prev[curr.channelId].push(curr.hash);
          return prev;
        }, {} as Record<string, string[]>),
      },
      result: {
        transactions: filteredTxs.reduce((prev, curr) => {
          if (!prev[curr.channelId]) {
            prev[curr.channelId] = [];
          }
          prev[curr.channelId].push(this.getTimestampedTransaction(curr));
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

    const { transactions } = await this.graphql.getTransactionsByHash(storageResult.id);

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
            timestamp: getCurrentTimestampInSecond(),
            transaction,
          },
        ],
      },
    };
  }

  private getTimestampedTransaction(
    transaction: Transaction,
  ): DataAccessTypes.ITimestampedTransaction {
    return {
      state: DataAccessTypes.TransactionState.CONFIRMED,
      timestamp: transaction.blockTimestamp,
      transaction: {
        data: transaction.data || undefined,
        encryptedData: transaction.encryptedData || undefined,
        encryptionMethod: transaction.encryptionMethod || undefined,
        keys: transaction.publicKeys?.reduce(
          (prev, curr, i) => ({
            ...prev,
            [curr]: transaction.encryptedKeys?.[i],
          }),
          {},
        ),
      },
    };
  }
}

export class TheGraphDataWrite implements DataAccessTypes.IDataWrite {
  private logger: LogTypes.ILogger;
  private network: string;
  private pendingStore?: PendingStore;

  constructor(
    protected readonly storage: StorageTypes.IStorageWrite,
    private readonly graphql: SubgraphClient,
    { network, logger, pendingStore }: TheGraphDataAccessBaseOptions,
  ) {
    this.logger = logger || new SimpleLogger();
    this.network = network;
    this.pendingStore = pendingStore;
  }

  async initialize(): Promise<void> {
    await this.graphql.getBlockNumber();
    await this.storage.initialize();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  async persistTransaction(
    transaction: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const updatedBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transaction,
      channelId,
      topics,
    );

    const storageResult = await this.storage.append(JSON.stringify(updatedBlock));

    return this.createPersistTransactionResult(channelId, transaction, storageResult, topics || []);
  }

  protected createPersistTransactionResult(
    channelId: string,
    transaction: DataAccessTypes.ITransaction,
    storageResult: StorageTypes.IAppendResult,
    topics: string[],
  ): DataAccessTypes.IReturnPersistTransaction {
    const eventEmitter = new EventEmitter() as DataAccessEventEmitter;
    this.pendingStore?.add(channelId, transaction, storageResult);

    const result: DataAccessTypes.IReturnPersistTransactionRaw = {
      meta: {
        transactionStorageLocation: storageResult.id,
        storageMeta: storageResult.meta,
        topics,
      },
      result: {},
    };

    storageResult.on('confirmed', () => {
      this.logger.debug(`Looking for ${storageResult.id} in subgraph`);
      retry(
        async () => {
          const response = await this.graphql.getTransactionsByHash(storageResult.id);
          if (response.transactions.length === 0) {
            throw Error('no transactions');
          }
          this.logger.debug(`Hash ${storageResult.id} found in subgraph.`);
          return response;
        },
        { maxRetries: 100, retryDelay: 1000 },
      )()
        .then((response) => {
          this.pendingStore?.remove(channelId);
          eventEmitter.emit('confirmed', {
            ...result,
            meta: {
              ...result.meta,
              storageMeta: getStorageMeta(
                response.transactions[0],
                response._meta.block.number,
                this.network,
              ),
            },
          });
        })
        .catch((error) => {
          this.pendingStore?.remove(channelId);
          eventEmitter.emit('error', error);
        });
    });

    return Object.assign(eventEmitter, result);
  }
}

class NoopDataWrite implements DataAccessTypes.IDataWrite {
  async initialize(): Promise<void> {
    // no-op
  }

  async close(): Promise<void> {
    // no-op
  }

  persistTransaction(): Promise<DataAccessTypes.IReturnPersistTransaction> {
    throw new Error(
      `cannot call persistTranscation without storage. Specify storage on ${TheGraphDataAccess.name}`,
    );
  }
}

export class TheGraphDataAccess extends CombinedDataAccess {
  private readonly graphql: SubgraphClient;
  private readonly storage: StorageTypes.IStorageWrite | undefined;

  constructor({ graphql, storage, ...options }: TheGraphDataAccessOptions) {
    const { url, ...rest } = graphql;
    if (!options.pendingStore) {
      options.pendingStore = new PendingStore();
    }
    const graphqlClient = new SubgraphClient(url, rest);

    const reader = new TheGraphDataRead(graphqlClient, options);

    const writer = storage
      ? new TheGraphDataWrite(storage, graphqlClient, options)
      : new NoopDataWrite();

    super(reader, writer);
    this.graphql = graphqlClient;
    this.storage = storage;
  }

  async _getStatus(): Promise<any> {
    let storage: any = null;
    if (this.storage && '_getStatus' in this.storage) {
      storage = await (this.storage as StorageTypes.IStorage)._getStatus();
    }
    return {
      lastBlock: await this.graphql.getBlockNumber(),
      endpoint: this.graphql.endpoint,
      storage,
    };
  }
}
