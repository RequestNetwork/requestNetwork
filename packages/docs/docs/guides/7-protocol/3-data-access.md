---
title: Data-access
keywords: [Request protocol, Data-access]
description: Learn how to integrate Request network and its features.

---

Data-Access is the layer that organizes the data in the right format before having them being stored in the storage layer. This layer is similar as the persistence layer in the classical layered architecture pattern.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/data-access](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/data-access)

### Blocks

Heavy communication with the Storage layer can be costly. For example, for a solution using Ethereum, every Ethereum transactions cost some gas.

Data-Access layer will gather transactions and batch them into blocks. This solution allows for less communication with the Storage layer. In this case, it will allow consuming less gas for Ethereum transactions.

### Local cache for accessing transaction

Data-Access is also responsible for other side tasks:

- Indexing transactions to allow retrieval
- Accessing transactions through a local cache
- Synchronizing with the storage

The storage phase is only complete when indexing has completed. Because this indexing is an Ethereum transaction, you cannot know in advance how long it will take.

It is the reason that, when a block is created or read from the storage, the transactions inside it will be indexed and kept in a local cache. When a user wants to get information about a request, Data-Access will directly fetch them from this local cache.

Data-Access stays synchronized with the storage layer. For example, it pulls for new blocks, added by other users, in the storage every 10 seconds.
