import { DataAccessTypes } from '@requestnetwork/types';
import { GraphQLClient } from 'graphql-request';
import {
  GetBlock,
  GetChannelsByTopicsQuery,
  GetTransactionsByChannelIdQuery,
  GetTransactionsByHashQuery,
  Meta,
  TransactionsBody,
} from './queries';

// Max Int value (as supported by grapqhl types)
const MAX_INT_VALUE = 0x7fffffff;

export class SubgraphClient {
  private graphql: GraphQLClient;
  public readonly endpoint: string;
  constructor(endpoint: string, options?: Omit<RequestInit, 'body'>) {
    this.endpoint = endpoint;
    this.graphql = new GraphQLClient(endpoint, options);
  }

  public async getBlockNumber(): Promise<number> {
    const { _meta } = await this.graphql.request<Meta>(GetBlock);
    return _meta.block.number;
  }

  public getTransactionsByHash(hash: string): Promise<TransactionsBody> {
    return this.graphql.request<TransactionsBody>(GetTransactionsByHashQuery, {
      hash,
    });
  }

  public getTransactionsByChannelId(
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<TransactionsBody> {
    return this.graphql.request<TransactionsBody>(GetTransactionsByChannelIdQuery, {
      channelId,
      ...this.getTimeVariables(updatedBetween),
    });
  }

  public getChannelsByTopics(topics: string[]): Promise<TransactionsBody> {
    return this.graphql.request<TransactionsBody>(GetChannelsByTopicsQuery, {
      topics,
    });
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
