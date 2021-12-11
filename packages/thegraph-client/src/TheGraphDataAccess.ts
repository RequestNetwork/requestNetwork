import { EventEmitter } from 'events';
import * as IPFS from 'ipfs-http-client';
import TypedEmitter from 'typed-emitter';

import { Signer } from 'ethers';

import Utils from '@requestnetwork/utils';
import { Block } from '@requestnetwork/data-access';
import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

import { TransactionsBody, Transaction } from './queries';
import { SubgraphClient } from './subgraphClient';
import { TheGraphStorage } from './TheGraphStorage';

export type TheGraphDataAccessOptions = {
  ipfs: IPFS.Options;
  graphql: {
    url: string;
    options?: RequestInit;
  };
  signer: Signer;
  network: string;
};

type DataAccessEventEmitter = TypedEmitter<{
  confirmed: ({}: {}) => void;
  error: (error: any) => void;
}>;

export class TheGraphDataAccess implements DataAccessTypes.IDataAccess {
  private network: string;

  private graphql: SubgraphClient;
  private pending: Record<string, DataAccessTypes.IReturnGetTransactions> = {};
  protected storage: TheGraphStorage;

  constructor({ ipfs, network, signer, graphql }: TheGraphDataAccessOptions) {
    this.graphql = new SubgraphClient(graphql.url, graphql.options);
    this.network = network;
    this.storage = new TheGraphStorage(network, signer, ipfs);
  }

  async initialize(): Promise<void> {
    await this.graphql.getBlockNumber();
    await this.storage.initialize();
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
    _timestampBoundaries?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    if (this.pending[channelId]) {
      return this.pending[channelId];
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
    _updatedBetween?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return this.getChannelsByMultipleTopics([topic]);
  }

  async getChannelsByMultipleTopics(
    topics: string[],
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

  _getStatus(_detailed?: boolean): Promise<any> {
    throw new Error('_getStatus not implemented.');
  }

  private setPending(
    channelId: string,
    transaction: DataAccessTypes.ITransaction,
    storageResult: StorageTypes.IAppendResult,
  ) {
    this.pending[channelId] = {
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
  ) {
    const eventEmitter = new EventEmitter() as DataAccessEventEmitter;
    this.setPending(channelId, transaction, storageResult);

    storageResult.on('confirmed', () => {
      Utils.retry(
        async () => {
          const { transactions } = await this.graphql.getTransactionsByHash(storageResult.id);
          if (transactions.length === 0) {
            throw Error('no transactions');
          }
        },
        { maxRetries: 20, retryDelay: 2000 },
      )()
        .then(() => {
          this.deletePending(channelId);
          eventEmitter.emit('confirmed', {});
        })
        .catch((error) => eventEmitter.emit('error', error));
    });

    return Object.assign(eventEmitter, {
      meta: {
        transactionStorageLocation: this.pending[channelId].meta.transactionsStorageLocation[0],
        storageMeta: this.pending[channelId].meta.storageMeta[0],
        topics,
      },
      result: {},
    });
  }

  private getStorageMeta(result: TransactionsBody) {
    return result.transactions.map((x) => ({
      ethereum: {
        blockConfirmation: 1, // TODO
        blockNumber: Number(x.blockNumber),
        blockTimestamp: Number(x.blockTimestamp),
        networkName: this.network,
        smartContractAddress: x.smartContractAddress,
        transactionHash: x.transactionHash,
      },
      ipfs: {
        size: 0, // TODO add to subgraph
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
