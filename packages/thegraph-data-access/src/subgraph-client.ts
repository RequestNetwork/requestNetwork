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

  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100;

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
    page?: number,
    pageSize?: number,
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    if (page !== undefined && page < 1) {
      throw new Error('Page must be greater than or equal to 1');
    }
    if (pageSize !== undefined && pageSize <= 0) {
      throw new Error('Page size must be greater than 0');
    }
    if (pageSize && pageSize > this.MAX_PAGE_SIZE) {
      throw new Error(`Page size cannot exceed ${this.MAX_PAGE_SIZE}`);
    }

    const effectivePageSize = pageSize ?? this.DEFAULT_PAGE_SIZE;
    const effectivePage = page ?? 1;
    const skip = (effectivePage - 1) * effectivePageSize;

    const { _meta, channels } = await this.graphql.request<
      Meta & { channels: { transactions: Transaction[] }[] }
    >(GetTransactionsByTopics, {
      topics,
      first: effectivePageSize,
      skip,
    });

    const transactionsByChannel = channels
      .map(({ transactions }) => transactions)
      .flat()
      .sort((a, b) => a.blockTimestamp - b.blockTimestamp);

    const indexedTransactions = transactionsByChannel.map(this.toIndexedTransaction);
    return {
      transactions: indexedTransactions,
      blockNumber: _meta.block.number,
      pagination: {
        page: effectivePage,
        pageSize: effectivePageSize,
        total: indexedTransactions.length,
        hasMore: skip + effectivePageSize < indexedTransactions.length,
      },
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
