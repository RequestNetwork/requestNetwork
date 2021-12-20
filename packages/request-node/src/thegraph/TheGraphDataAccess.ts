import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { BigNumber, Signer } from 'ethers';

import Utils from '@requestnetwork/utils';
import { Block } from '@requestnetwork/data-access';
import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';

import { TransactionsBody, Transaction } from './queries';
import { SubgraphClient } from './subgraphClient';
import { TheGraphStorage } from './TheGraphStorage';

export type TheGraphDataAccessOptions = {
  ipfsStorage: StorageTypes.IIpfsStorage;
  graphql: { url: string } & RequestInit;
  signer: Signer;
  network: string;
  logger?: LogTypes.ILogger;
};

type DataAccessEventEmitter = TypedEmitter<{
  confirmed: (data: DataAccessTypes.IReturnPersistTransactionRaw) => void;
  error: (error: unknown) => void;
}>;

export class TheGraphDataAccess implements DataAccessTypes.IDataAccess {
  private network: string;

  private graphql: SubgraphClient;
  private pending: Record<
    string,
    { transaction: DataAccessTypes.ITransaction; storageResult: StorageTypes.IAppendResult }
  > = {};
  protected storage: TheGraphStorage;
  private logger: LogTypes.ILogger;

  constructor({ ipfsStorage, network, signer, graphql, logger }: TheGraphDataAccessOptions) {
    this.logger = logger || new Utils.SimpleLogger();
    const { url, ...options } = graphql;
    this.graphql = new SubgraphClient(url, options);
    this.network = network;
    this.storage = new TheGraphStorage({ network, signer, ipfsStorage, logger: this.logger });
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

  async getTransactionsByChannelId(
    channelId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const pending = await this.getPending(channelId);

    const result = await this.graphql.getTransactionsByChannelId(channelId);

    return {
      meta: {
        transactionsStorageLocation: result.transactions
          .map((x) => x.hash)
          .concat(pending.meta.transactionsStorageLocation),
        storageMeta: this.getStorageMeta(result),
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return this.getChannelsByMultipleTopics([topic]);
  }

  async getChannelsByMultipleTopics(
    topics: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    const result = await this.graphql.getChannelsByTopics(topics);

    return {
      meta: {
        storageMeta: this.getStorageMeta(result),
        transactionsStorageLocation: result.transactions.reduce((prev, curr) => {
          if (!prev[curr.channelId]) {
            prev[curr.channelId] = [];
          }
          prev[curr.channelId].push(curr.hash);
          return prev;
        }, {} as Record<string, string[]>),
      },
      result: {
        transactions: result.transactions.reduce((prev, curr) => {
          if (!prev[curr.channelId]) {
            prev[curr.channelId] = [];
          }
          prev[curr.channelId].push(this.getTimestampedTransaction(curr));
          return prev;
        }, {} as DataAccessTypes.ITransactionsByChannelIds),
      },
    };
  }

  async _getStatus(): Promise<any> {
    return {
      lastBlock: await this.graphql.getBlockNumber(),
      storage: await this.storage._getStatus(),
    };
  }

  private setPending(
    channelId: string,
    transaction: DataAccessTypes.ITransaction,
    storageResult: StorageTypes.IAppendResult,
  ) {
    this.pending[channelId] = { transaction, storageResult };
  }

  private async getPending(channelId: string): Promise<DataAccessTypes.IReturnGetTransactions> {
    const emptyResult = {
      meta: {
        transactionsStorageLocation: [],
        storageMeta: {},
      },
      result: {
        transactions: [],
      },
    };
    if (!this.pending[channelId]) {
      return emptyResult;
    }
    const { storageResult, transaction } = this.pending[channelId];

    const { transactions } = await this.graphql.getTransactionsByHash(
      this.pending[channelId].storageResult.id,
    );

    // if the pending tx is found, remove its state and fetch the real data
    if (transactions.length > 0) {
      this.deletePending(channelId);
      return emptyResult;
    }

    return {
      meta: {
        transactionsStorageLocation: [storageResult.id],
        storageMeta: [{ meta: storageResult.meta }],
      },
      result: {
        transactions: [
          {
            state: DataAccessTypes.TransactionState.PENDING,
            timestamp: Utils.getCurrentTimestampInSecond(),
            transaction,
          },
        ],
      },
    };
  }

  private deletePending(channelId: string) {
    delete this.pending[channelId];
  }

  protected createPersistTransactionResult(
    channelId: string,
    transaction: DataAccessTypes.ITransaction,
    storageResult: StorageTypes.IAppendResult,
    topics: string[],
  ): DataAccessTypes.IReturnPersistTransaction {
    const eventEmitter = new EventEmitter() as DataAccessEventEmitter;
    this.setPending(channelId, transaction, storageResult);

    const result: DataAccessTypes.IReturnPersistTransactionRaw = {
      meta: {
        transactionStorageLocation: this.pending[channelId].storageResult.id,
        storageMeta: this.pending[channelId].storageResult.meta,
        topics,
      },
      result: {},
    };

    storageResult.on('confirmed', () => {
      Utils.retry(
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
          this.deletePending(channelId);
          eventEmitter.emit('confirmed', {
            ...result,
            meta: {
              ...result.meta,
              storageMeta: this.getStorageMeta(response),
            },
          });
        })
        .catch((error) => {
          this.deletePending(channelId);
          eventEmitter.emit('error', error);
        });
    });

    return Object.assign(eventEmitter, result);
  }

  private getStorageMeta(result: TransactionsBody): StorageTypes.IEntryMetadata[] {
    return result.transactions.map((x) => ({
      ethereum: this.getEthereumMeta(result, x),
      ipfs: {
        size: BigNumber.from(x.size).toNumber(),
      },
      state: StorageTypes.ContentState.CONFIRMED,
      storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      timestamp: x.blockTimestamp,
    }));
  }

  private getEthereumMeta(
    result: TransactionsBody,
    x: Transaction,
  ): StorageTypes.IEthereumMetadata {
    return {
      blockConfirmation: result._meta.block.number - x.blockNumber,
      blockNumber: x.blockNumber,
      blockTimestamp: x.blockTimestamp,
      networkName: this.network,
      smartContractAddress: x.smartContractAddress,
      transactionHash: x.transactionHash,
    };
  }

  private getTimestampedTransaction(
    transaction: Transaction,
  ): DataAccessTypes.ITimestampedTransaction {
    return {
      state: DataAccessTypes.TransactionState.CONFIRMED,
      timestamp: 0,
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
