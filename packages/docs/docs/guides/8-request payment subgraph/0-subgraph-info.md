---
title: Storage Subgraph Entities
keywords: [Subgraph, Entities, Schema]
description: Subgraph entities and descriptions.
---

# Transaction

Description: get specific details of the transaction

| Field                | Type      | Description                                                                                  |
| -------------------- | --------- | -------------------------------------------------------------------------------------------- |
| id                   | ID!       | a unique ID based on IPFS hash & position of the transaction in the document                 |
| hash                 | String!   | IPFS has                                                                                     |
| channelId            | String!   | invoice ID for transaction                                                                   |
| data                 | String    | request data is the current state of a request,                                              |
| encryptedData        | String    | If the request is encrypted, the transactions are decrypted in this layer                    |
| encryptionMethod     | String    | Advanced Encryption Standard (AES) or Elliptic Curve Integrated Encryption Scheme (ECIES)    |
| publicKeys           | [String!] | unique channel key that is shared to all the stakeholders                                    |
| encryptedKeys        | [String!] | set of private keys where each is privately held by the stakeholder                          |
|                      |
| blockNumber          | Int!      | blocknumber of the transaction                                                               |
| blockTimestamp       | Int!      | block timestamp of transaction                                                               |
| transactionHash      | String!   | transaction hash of transaction                                                              |
| smartContractAddress | String!   | smartcontract address of the transaction                                                     |
| size                 | String!   | size of the transaction                                                                      |
| topics               | [String!] | topic is a string that is used to index a request. This topic is used for request retrieval. |