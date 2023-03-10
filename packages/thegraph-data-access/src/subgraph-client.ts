import { DataAccessTypes } from '@requestnetwork/types';
import { retry } from '@requestnetwork/utils';
import { GraphQLClient } from 'graphql-request';
import {
  GetBlock,
  GetChannelsByTopicsQuery,
  GetTransactionsByChannelIdQuery,
  GetTransactionsByHashQuery,
  Meta,
  TransactionsBody,
} from './queries';
import { RequestInit } from 'graphql-request/dist/types.dom';
import { Variables } from 'graphql-request/dist/types';

// Max Int value (as supported by grapqhl types)
const MAX_INT_VALUE = 0x7fffffff;

export type SubgraphClientOptions = RequestInit & {
  /** @see `retry` from @requestnetwork/utils */
  maxRetries?: number;
  /** @see `retry` from @requestnetwork/utils */
  retryDelay?: number;
};

export class SubgraphClient {
  private graphql: GraphQLClient;
  public readonly endpoint: string;
  constructor(endpoint: string, options?: RequestInit) {
    this.endpoint = endpoint;
    this.graphql = new GraphQLClient(endpoint, options);
  }

  public async getBlockNumber(): Promise<number> {
    const { _meta } = await this.request<Meta>(GetBlock);
    return _meta.block.number;
  }

  public getTransactionsByHash(hash: string): Promise<TransactionsBody> {
    return this.request<TransactionsBody>(GetTransactionsByHashQuery, {
      hash,
    });
  }

  public getTransactionsByChannelId(
    channelId: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<TransactionsBody> {
    return this.request<TransactionsBody>(GetTransactionsByChannelIdQuery, {
      channelId,
      ...this.getTimeVariables(updatedBetween),
    });
  }

  public getChannelsByTopics(topics: string[]): Promise<TransactionsBody> {
    return this.request<TransactionsBody>(GetChannelsByTopicsQuery, {
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

  private request<T, V = Variables>(document: string, variables?: V) {
    return retry(() => this.graphql.request<T>(document, variables), {
      maxRetries: 5,
      retryDelay: 100,
    })();
  }
}
