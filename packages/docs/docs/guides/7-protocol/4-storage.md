---
title: Storage
keywords: [Request protocol, Storage, IPFS, Ethereum]
description: Learn how to integrate Request network and its features.

---

Storage defines where the data are stored. How to store these data and how to retrieve them.

The currently used package, named `ethereum-storage`, uses IPFS to immutably store the data and uses the Ethereum network to persist the IPFS hash of the data and make them permanently available to everyone.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/ethereum-storage](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/ethereum-storage)

The storage of data implementation is:

- Open: Anyone should be able to access the data (though it can be encrypted)
- Decentralized: The database is trustless, we don’t have to refer to a third party to trust data
- Resilient: The database should be always available, nobody should be able to shutdown it alone

### IPFS

The interplanetary file system (IPFS) is a decentralized network to store and share files: [https://ipfs.io](https://ipfs.io/)

One of the advantages of IPFS as a storage solution is that it is content addressable. When a file is deleted, if someone reuploads the file, anybody will be able to access it with the same path. For a specific block of data, we will get a specific hash, the hash is persisted on Ethereum to ensure requests immutability.

### Ethereum

We use Ethereum to store IPFS hashes. The hashes are stored as event logs of a specific smart contract to stay at a minimal cost.

The Ethereum smart contracts are also used to enforce the fee cost of storing a block to Request. The user will store the size of the file being stored in addition to the hash. A fee, related to this hash, will be paid in Ether when storing the hash.

For our solution, we use additional smart contracts for fee verification. Using external smart contracts allows us to implement different fee rules in the future. More information can be found in the ethereum-storage repository.

The RequestHashStorage smart contract address can be found on [GitHub](https://github.com/RequestNetwork/requestNetwork/blob/1f24dd17353497cc6ee21abf2d7bfda9e63d2ba5/packages/smart-contracts/artifacts/RequestHashStorage/artifacts.json)
```json
 "mainnet": {
  "address": "0x24a66afda3666fb0202f439708ece45c8121a9bb"
},
"rinkeby": {
  "address": "0x309a3a9898f9cafc26499243a980992156671e5e"
}
```
