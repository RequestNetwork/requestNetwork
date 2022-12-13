---
title: Subgraph Query Examples
keywords: [Subgraph, query, Schema]
description: Subgraph query examples.
---

# Querying

Below are some sample queries you can use to gather information from the Request contracts.

You can build your own queries using a [GraphQL Explorer](https://graphiql-online.com/graphiql) and enter your endpoint to limit the data to exactly what you need.

# Last 5 Payments

```graphql
{
  payments(first: 5, orderBy: timestamp, orderDirection: desc) {
    contractAddress
    tokenAddress
    to
    from
    amount
    feeAmount
    reference
    block
    txHash
  }
}
```

# By Payment Reference

```graphql
{
  payments(
    where: {
      reference: "0x2e2b6851447f35e0ae5018b2049138402ec089f744e6a691af030f0fa731d8d8"
    }
  ) {
    contractAddress
    tokenAddress
    to
    from
    amount
    txHash
    block
    reference
    timestamp
  }
}
```

# Get first 5 payments and escrows

```graphql
{
  payments(first: 5) {
    id
    contractAddress
    tokenAddress
    to
  }
  escrows(first: 5) {
    id
    contractAddress
    paymentProxyAddress
    reference
  }
}
```
