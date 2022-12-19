---
title: Price Aggregator Subgraph Query Examples
keywords: [Subgraph, query, Schema]
description: Subgraph query examples.
---

# Querying

Below are some sample queries you can use to gather information from the Request contracts.

You can build your own queries using a [GraphQL Explorer](https://graphiql-online.com/graphiql) and enter your endpoint to limit the data to exactly what you need.

# Get first 5 Aggregators

```graphql
{
  aggregators(first: 5) {
    id
    input
    outputs
  }
}
```

