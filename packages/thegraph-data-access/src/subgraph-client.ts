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
import { Variables, RequestConfig } from 'graphql-request/build/cjs/types';

// Max Int value (as supported by grapqhl types)
const MAX_INT_VALUE = 0x7fffffff;

export class SubgraphClient implements StorageTypes.IIndexer {
  private graphql: GraphQLClient;
  public readonly endpoint: string;
  constructor(endpoint: string, options?: RequestConfig) {
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

  // FIXME: this should be possible to do in a single query to the subgraph,
  // but currently one transaction doesn't contain topics from previous ones on the same channel.
  // This could be fixed on the Subgraph indexer code for optimization.
  public async getTransactionsByTopics(
    topics: string[],
  ): Promise<StorageTypes.IGetTransactionsResponse> {
    const { _meta, transactions } = await this.graphql.request<
      Meta & { transactions: { channelId: string }[] }
    >(GetChannelsByTopicsQuery, { topics });

    const channelIds = transactions
      .map((x) => x.channelId)
      .filter((val, i, self) => self.indexOf(val) === i);
    const transactionsByChannel = await Promise.all(
      channelIds.map((channelId) =>
        this.graphql
          .request<TransactionsBody>(GetTransactionsByChannelIdQuery, {
            channelId,
            ...this.getTimeVariables({}),
          })
          .then((x) => x.transactions),
      ),
    ).then((x) => x.flat());

    return {
      transactions: transactionsByChannel.map(this.toIndexedTransaction),
      blockNumber: _meta.block.number,
    };
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
