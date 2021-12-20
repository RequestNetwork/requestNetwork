import { gql } from 'graphql-request';

export type Meta = {
  _meta: { block: { number: number } };
};

export type Transaction = {
  hash: string;
  channelId: string;
  data?: string;
  encryptedData?: string;
  encryptionMethod?: string;
  publicKeys?: string[];
  encryptedKeys?: string[];
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
  smartContractAddress: string;
  topics: string[];
  size: string;
};

export type TransactionsBody = Meta & {
  transactions: Transaction[];
};

const TransactionsBodyFragment = gql`
  fragment TransactionsBody on Transaction {
    hash
    channelId
    encryptionMethod
    publicKeys
    encryptedKeys
    data
    encryptedData
    blockNumber
    blockTimestamp
    transactionHash
    smartContractAddress
    topics
    size
  }
`;

export const GetTransactionsByChannelIdQuery = gql`
  ${TransactionsBodyFragment}
  query GetTransactionsByChannelId($channelId: String!) {
    _meta {
      block {
        number
      }
    }
    transactions(where: { channelId: $channelId }, orderBy: blockTimestamp, orderDirection: asc) {
      ...TransactionsBody
    }
  }
`;

export const GetTransactionsByHashQuery = gql`
  ${TransactionsBodyFragment}
  query GetTransactionsByHash($hash: String!) {
    _meta {
      block {
        number
      }
    }
    transactions(where: { hash: $hash }, orderBy: blockTimestamp, orderDirection: asc) {
      ...TransactionsBody
    }
  }
`;

export const GetChannelsByTopicsQuery = gql`
  ${TransactionsBodyFragment}
  query GetChannelsByTopics($topics: [String!]!) {
    _meta {
      block {
        number
      }
    }
    transactions(
      where: { topics_contains: $topics }
      orderBy: blockTimestamp
      orderDirection: asc
    ) {
      ...TransactionsBody
    }
  }
`;

export const GetBlock = gql`
  query {
    _meta {
      block {
        number
      }
    }
  }
`;
