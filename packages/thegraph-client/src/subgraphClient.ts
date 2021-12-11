import { GraphQLClient } from 'graphql-request';
import {
  GetBlock,
  GetChannelsByTopicsQuery,
  GetTransactionsByChannelIdQuery,
  GetTransactionsByHashQuery,
  TransactionsBody,
} from './queries';

export class SubgraphClient {
  private graphql: GraphQLClient;
  constructor(endpoint: string, options?: RequestInit) {
    this.graphql = new GraphQLClient(endpoint, options);
  }

  public getBlockNumber() {
    return this.graphql.request(GetBlock);
  }
  public getTransactionsByHash(hash: string) {
    return this.graphql.request<TransactionsBody>(GetTransactionsByHashQuery, {
      hash,
    });
  }

  public getTransactionsByChannelId(channelId: string) {
    return this.graphql.request<TransactionsBody>(GetTransactionsByChannelIdQuery, { channelId });
  }

  public getChannelsByTopics(topics: string[]) {
    return this.graphql.request<TransactionsBody>(GetChannelsByTopicsQuery, {
      topics,
    });
  }
}
