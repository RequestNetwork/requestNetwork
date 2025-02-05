import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { GraphQLClient } from 'graphql-request';
import {
  GetBlockQuery,
  GetTransactionByDataHashQuery,
  GetTransactionsByChannelIdQuery,
  GetTransactionsByHashQuery,
  GetTransactionsByTopics,
  Meta,
  Transaction,
  TransactionsBody,
} from './queries';
import { Variables, RequestConfig } from 'graphql-request/build/cjs/types';

// Max Int value (as supported by grapqhl types)
const MAX_INT_VALUE = 0x7fffffff;

export class SubgraphClient implements StorageTypes.IIndexer {
  private graphql: GraphQLClient;
  public readonly endpoint: string;

  private readonly DEFAULT_PAGE_SIZE = 100;
  private readonly MAX_PAGE_SIZE = 1000;

  constructor(endpoint: string, options?: RequestConfig) {
    this.endpoint = endpoint;
    this.graphql = new GraphQLClient(endpoint, options);
  }

  public async initialize(): Promise<void> {
    await this.getBlockNumber();
  }

  public async getBlockNumber(): Promise<number> {
    const { _meta } = await this.graphql.request<Meta>(GetBlockQuery);
    return _meta.block.number;
  }

  public getTransactionsByStorageLocation(
    hash: string,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    return this.fetchAndFormat(GetTransactionsByHashQuery, { hash });
  }

  public getTransactionsByChannelId(
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    return this.fetchAndFormat(GetTransactionsByChannelIdQuery, {
      channelId,
      ...this.getTimeVariables(updatedBetween),
    });
  }

  public async getTransactionsByTopics(
    topics: string[],
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    const { _meta, channels } = await this.graphql.request<
      Meta & { channels: { transactions: Transaction[] }[] }
    >(GetTransactionsByTopics, {
      topics,
    });

    const transactionsByChannel = channels
      .map(({ transactions }) => transactions)
      .flat()
      .sort((a, b) => a.blockTimestamp - b.blockTimestamp);

    const indexedTransactions = transactionsByChannel.map(this.toIndexedTransaction);

    return {
      transactions: indexedTransactions,
      blockNumber: _meta.block.number,
    };
  }

  public async getTransactionsByDataHash(
    dataHash: string,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    return await this.fetchAndFormat(GetTransactionByDataHashQuery, { dataHash });
  }

  private async fetchAndFormat(
    query: string,
    parameters: Variables | undefined,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    const { _meta, transactions } = await this.graphql.request<TransactionsBody>(query, parameters);
    return {
      transactions: transactions.map(this.toIndexedTransaction),
      blockNumber: _meta.block.number,
    };
  }

  private toIndexedTransaction({
    publicKeys,
    encryptedKeys,
    ...transaction
  }: Transaction): StorageTypes.IIndexedTransaction {
    return {
      ...transaction,
      keys:
        publicKeys?.reduce(
          (prev, curr, i) => ({
            ...prev,
            [curr]: encryptedKeys?.[i] || '',
          }),
          {} as Record<string, string>,
        ) || undefined,
    };
  }

  private getTimeVariables(updatedBetween?: DataAccessTypes.ITimestampBoundaries) {
    if (!updatedBetween) {
      updatedBetween = {};
    }
    return {
      from: updatedBetween.from || 0,
      to: updatedBetween.to || MAX_INT_VALUE,
    };
  }
}
