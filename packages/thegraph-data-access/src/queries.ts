import { gql } from 'graphql-request';

export type Meta = {
  _meta: { block: { number: number } };
};

const metaQueryBody = `
  _meta {
    block {
      number
    }
  }
`;

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
  query GetTransactionsByChannelId($channelId: String!, $from: Int, $to: Int) {
    ${metaQueryBody}
    transactions(
      where: { channelId: $channelId, blockTimestamp_gte: $from, blockTimestamp_lt: $to }
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
    ${metaQueryBody}
    transactions(where: { hash: $hash }, orderBy: blockTimestamp, orderDirection: asc) {
      ...TransactionsBody
    }
  }
`;

export const GetTransactionsByTopics = gql`
${TransactionsBodyFragment}

query GetTransactionsByTopics($topics: [String!]!) {
  ${metaQueryBody}
  channels(
    where: { topics_contains: $topics }
  ){
    transactions(
      orderBy: blockTimestamp, 
      orderDirection: asc
    ) {
      ...TransactionsBody
    }
  }
}`;

export const GetBlockQuery = gql`
  query GetBlock {
    ${metaQueryBody}
  }
`;

export const GetTransactionByDataHashQuery = gql`
  ${TransactionsBodyFragment}
  query GetTransactionsByDataHash($dataHash: String!) {
    ${metaQueryBody}
    transactions(where: { dataHash: $dataHash }) {
      ...TransactionsBody
    }
  }
`;
