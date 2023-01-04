---
title: Request Subgraph for Storage Subgraph
keywords: [Subgraph, API, Indexing]
description: General information and links about the subgraph.
---

# Request Network Storage Subgraph

Request has a GraphQL API Endpoint hosted by [The Graph](https://thegraph.com/docs/about/introduction#what-the-graph-is) called a subgraph for indexing and organizing data from the Request smart contracts.

Request leverages the [Graph Protocol](https://thegraph.com) to simplify the process of making meaningful applications using the Request Smart Contracts and associated data.

This subgraph not deployed on TheGraph network, but on a private node. Below is documentation on how to run.  


## Getting started

- Do the usual
```
git clone ...
cd ...
yarn
```
- Prepare your environment
```
cp .env.example .env
```

- Start a Graph Node and an IPFS node (connected to Request dedicated IPFS network)

```
docker-compose up -d
```

- Create the subgraph. Do this only once (or each time you clear the Graph node)
```
yarn create-local ./subgraph-private.yaml
```

- Generate types for the subgraph. Do this again if you modify the [indexer's code](./src/mapping.ts) or the [graphql schema](./schema.graphql)
```
yarn codegen ./subgraph-private.yaml
```

- Build the subgraph. Do this again if you modify the [indexer's code](./src/mapping.ts) or the [graphql schema](./schema.graphql)
```
yarn build ./subgraph-private.yaml
```

- Deploy and start indexing. Do this again if you modify the [indexer's code](./src/mapping.ts) or the [graphql schema](./schema.graphql)
```
yarn deploy-local ./subgraph-private.yaml
```


You can go to http://localhost:8000/ to see the GraphiQL ui.