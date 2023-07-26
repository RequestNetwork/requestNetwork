import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { GraphQLClient } from 'graphql-request';
import {
  GetBlock,
  GetChannelsByTopicsQuery,
  GetTransactionsByChannelIdQuery,
  GetTransactionsByHashQuery,
  Meta,
  Transaction,
  TransactionsBody,
} from './queries';
import { RequestInit } from 'graphql-request/dist/types.dom';
import { Variables } from 'graphql-request/dist/types';

// Max Int value (as supported by grapqhl types)
const MAX_INT_VALUE = 0x7fffffff;

export class SubgraphClient implements StorageTypes.IIndexer {
  private graphql: GraphQLClient;
  public readonly endpoint: string;
  constructor(endpoint: string, options?: RequestInit) {
    this.endpoint = endpoint;
    this.graphql = new GraphQLClient(endpoint, options);
  }

  public async initialize(): Promise<void> {
    await this.getBlockNumber();
  }

  public async getBlockNumber(): Promise<number> {
    const { _meta } = await this.graphql.request<Meta>(GetBlock);
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

  public getTransactionsByTopics(topics: string[]): Promise<StorageTypes.IGetTransactionsResponse> {
    return this.fetchAndFormat(GetChannelsByTopicsQuery, { topics });
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
