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
| hash                 | String!   | IPFS hash                                                                                    |
| channelId            | String!   | hash of the first transaction in the channel                                                 |
| data                 | String    | transaction data, used for clear channels                                                    |
| encryptedData        | String    | transaction data, used for encrypted channels                                                |
| encryptionMethod     | String    | Encryption methods for channel key and transactions, concatenated together                   |
| publicKeys           | [String!] | Encryption stakeholder identities included in the transaction                                |
| encryptedKeys        | [String!] | Channel key, encrypted using each stakeholder's public key                                   |
| blockNumber          | Int!      | blocknumber of the transaction                                                               |
| blockTimestamp       | Int!      | block timestamp of transaction                                                               |
| transactionHash      | String!   | transaction hash of transaction                                                              |
| smartContractAddress | String!   | storage contract address                                                                     |
| size                 | String!   | size of the transaction                                                                      |
| topics               | [String!] | topic is a string that is used to index a request. This topic is used for request retrieval. |
