import { EventEmitter } from 'events';
import * as IPFS from 'ipfs-http-client';
import TypedEmitter from 'typed-emitter';

import { BigNumber, Signer } from 'ethers';

import Utils from '@requestnetwork/utils';
import { Block } from '@requestnetwork/data-access';
import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';

import { TransactionsBody, Transaction } from './queries';
import { SubgraphClient } from './subgraphClient';
import { TheGraphStorage } from './TheGraphStorage';

export type TheGraphDataAccessOptions = {
  ipfs: IPFS.Options;
  graphql: { url: string } & RequestInit;
  signer: Signer;
  network: string;
  logger?: LogTypes.ILogger;
};

type DataAccessEventEmitter = TypedEmitter<{
  // TODO fix the data type
  confirmed: (data: unknown) => void;
  error: (error: any) => void;
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

  constructor({ ipfs, network, signer, graphql, logger }: TheGraphDataAccessOptions) {
    this.logger = logger || new Utils.SimpleLogger();
    const { url, ...options } = graphql;
    this.graphql = new SubgraphClient(url, options);
    this.network = network;
    this.storage = new TheGraphStorage({ network, signer, ipfs, logger: this.logger });
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
    // TODO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _timestampBoundaries?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const pending = await this.getPending(channelId);
    if (pending) {
      return pending;
    }
    const result = await this.graphql.getTransactionsByChannelId(channelId);

    return {
      meta: {
        transactionsStorageLocation: result.transactions.map((x) => x.hash),
        storageMeta: this.getStorageMeta(result),
      },
      result: {
        transactions: result.transactions.map(this.getTimestampedTransaction),
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _getStatus(_detailed?: boolean): Promise<any> {
    throw new Error('_getStatus not implemented.');
  }

  private setPending(
    channelId: string,
    transaction: DataAccessTypes.ITransaction,
    storageResult: StorageTypes.IAppendResult,
  ) {
    this.pending[channelId] = { transaction, storageResult };
  }

  private async getPending(
    channelId: string,
  ): Promise<DataAccessTypes.IReturnGetTransactions | null> {
    if (!this.pending[channelId]) {
      return null;
    }
    const { storageResult, transaction } = this.pending[channelId];

    const { transactions } = await this.graphql.getTransactionsByHash(
      this.pending[channelId].storageResult.id,
    );

    // if the pending tx is found, remove its state and fetch the real data
    if (transactions.length > 0) {
      this.deletePending(channelId);
      return null;
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

    storageResult.on('confirmed', () => {
      Utils.retry(
        async () => {
          const { transactions } = await this.graphql.getTransactionsByHash(storageResult.id);
          if (transactions.length === 0) {
            throw Error('no transactions');
          }
          this.logger.debug(`Hash ${storageResult.id} found in subgraph.`);
        },
        { maxRetries: 100, retryDelay: 1000 },
      )()
        .then(() => {
          this.deletePending(channelId);
          eventEmitter.emit('confirmed', {});
        })
        .catch((error) => {
          this.deletePending(channelId);
          eventEmitter.emit('error', error);
        });
    });

    return Object.assign(eventEmitter, {
      meta: {
        transactionStorageLocation: this.pending[channelId].storageResult.id,
        storageMeta: this.pending[channelId].storageResult.meta,
        topics,
      },
      result: {},
    });
  }

  private getStorageMeta(result: TransactionsBody) {
    return result.transactions.map((x) => ({
      ethereum: {
        blockConfirmation: result._meta.block.number - x.blockNumber,
        blockNumber: Number(x.blockNumber),
        blockTimestamp: Number(x.blockTimestamp),
        networkName: this.network,
        smartContractAddress: x.smartContractAddress,
        transactionHash: x.transactionHash,
      },
      ipfs: {
        size: BigNumber.from(x.size).toNumber(),
      },
      state: DataAccessTypes.TransactionState.CONFIRMED,
      storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      timestamp: x.blockTimestamp,
    }));
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
