import { gql } from "graphql-request";

export type Transaction = {
  hash: string;
  channelId: string;
  data?: string;
  encryptedData?: string;
  encryptionMethod?: string;
  publicKeys?: string[];
  encryptedKeys?: string[];
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  smartContractAddress: string;
  topics: string[];
};

export type TransactionsBody = {
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
  }
`;

export const GetTransactionsByChannelIdQuery = gql`
  ${TransactionsBodyFragment}
  query GetTransactionsByChannelId($channelId: String!) {
    transactions(
      where: { channelId: $channelId }
      orderBy: blockTimestamp
      orderDirection: asc
    ) {
      ...TransactionsBody
    }
  }
`;

export const GetTransactionsByHashQuery = gql`
  ${TransactionsBodyFragment}
  query GetTransactionsByHash($hash: String!) {
    transactions(
      where: { hash: $hash }
      orderBy: blockTimestamp
      orderDirection: asc
    ) {
      ...TransactionsBody
    }
  }
`;

export const GetChannelsByTopicsQuery = gql`
  ${TransactionsBodyFragment}
  query GetChannelsByTopics($topics: [String!]!) {
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
