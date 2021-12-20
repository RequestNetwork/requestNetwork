import { GraphQLClient } from 'graphql-request';
import {
  GetBlock,
  GetChannelsByTopicsQuery,
  GetTransactionsByChannelIdQuery,
  GetTransactionsByHashQuery,
  Meta,
  TransactionsBody,
} from './queries';

export class SubgraphClient {
  private graphql: GraphQLClient;
  constructor(endpoint: string, options?: Omit<RequestInit, 'body'>) {
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

  public getTransactionsByChannelId(channelId: string): Promise<TransactionsBody> {
    return this.graphql.request<TransactionsBody>(GetTransactionsByChannelIdQuery, {
      channelId,
    });
  }

  public getChannelsByTopics(topics: string[]): Promise<TransactionsBody> {
    return this.graphql.request<TransactionsBody>(GetChannelsByTopicsQuery, {
      topics,
    });
  }
}
