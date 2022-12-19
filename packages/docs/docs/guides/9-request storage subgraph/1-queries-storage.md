---
title: Storage Subgraph Query Examples
keywords: [Subgraph, query, Schema]
description: Subgraph query examples.
---

# Querying

Below are some sample queries you can use to gather information from the Request contracts.

You can build your own queries using a [GraphQL Explorer](https://graphiql-online.com/graphiql) and enter your endpoint to limit the data to exactly what you need.

# Get all transactions

```graphql
query AllTransactions {
  transactions {
    id
    hash
    channelId
    blockNumber
    blockTimestamp
    smartContractAddress
    topics
    data
    encryptedData
    encryptionMethod
    publicKeys
  }
}
```

# Get transactions by channelID

```graphql
query ByChannelId($channelId: String!) {
  transactions(where: { channelId: $channelId }) {
    id
    hash
    channelId
    blockNumber
    blockTimestamp
    smartContractAddress
    topics
    data
    encryptedData
    encryptionMethod
    publicKeys
  }
}
```

# Get transactoins by topic

```graphql
query ByChannelId($topics: [String!]) {
  transactions(where: { topics_contains: $topics }) {
    id
    hash
    channelId
    blockNumber
    blockTimestamp
    smartContractAddress
    topics
    data
    encryptedData
    encryptionMethod
    publicKeys
  }
}
```
