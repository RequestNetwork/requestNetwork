---
title: Introduction to the Request Protocol
keywords: [Request protocol, IPFS, Ethereum]

---

Request is an open and unique database for payment requests including invoices or individual payment requests. It is aimed to be universal and to power products used by different companies from startups to large organizations, from the private to public sector.

The Request Protocol is the core of Request. It's the bottom layer that defines and handles the data of a request and persist them to a distributed ledger to make Request open, trustless, secure and resilient.

This document is aimed to help you to understand how the protocol is structured, how it works and how it meets its requirements.

# Overview

The Request Protocol has one basic purpose: **to persist, on a distributed ledger, data representing requests and to be able to retrieve these data in an efficient way**.

To organize these different purposes, the Request Protocol follows the layered architecture pattern. Each layer is responsible for a specific task and a specific level of abstraction. This layered architecture also simplifies the understandability of the code, we believe it's an important matter for an open-source project.

The protocol is composed of four layers:
- Request logic
- Transaction
- Data Access
- Storage

![](/img/RequestProtocol/1-LayersPresentation.jpg)
*Layers of the Request Protocol, each layer is described in the next section*

This layered architecture allows packages reusability and makes the protocol more upgradeable. For example, our current implementation uses Ethereum and IPFS but if Storj turns out to be a better solution for storing data into a decentralized database than IPFS, we can simply create a new storage layer that uses Storj over IPFS and make the data-access layer using this new package instead.

## Interface vs implementation

The protocol follows a defined interface, each layer has to implement a specific interface. The interfaces for each layer can be found in the Types package of Request Network repository: [https://github.com/RequestNetwork/requestNetwork/tree/master/packages/types](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/types).

The following parts present the first implementation of the protocol used for the released version of Request V2 on mainnet.

# Protocol layers

## Request Logic

This layer is responsible for the business logic of Request. This is where we define the data structure of a request.

This layer has three responsibilities:

- It defines the properties of the requests and the actions performed to them.
- It's responsible of the signature of the actions performed to ensure the request stakeholder identities.
- It manages extensions that can be created to extend the features of the Request Protocol through the Advanced Logic package.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-logic](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-logic)

### Actions

Actions are the basic elements that compose a request. At this layer's point of view, a request is simply a list of different actions.

![](/img/RequestProtocol/2-RequestPresentation.jpg)
*Example of a request in Request Logic represented by a list of actions*

- The payee creates the request requesting 1 ETH to the payer
- The payer accepts the request
- The payer increases the expected amount of the request by 1 ETH (the expected amount of the request can only be increased by the payer and decreased by the payee)

Given the list of these actions, we can interpret the state of the request `0xaaa`, it's a request that has been accepted by the payer where he will have to pay 2 ETH to the payee.

Note that the request Id is determined by the hash of the `create` action. Therefore, this action doesn't specify the request Id since it doesn't exist yet. The update actions (`accept` and `increaseExpectedAmount`) specify the request Id in their data.

There are two kind of action:

- Create: This action is not related to an existing request, it will create a new one
- Update: All other actions, it will update the state of an existing request

### Signature

In addition to providing the structure to form an action composing a request, the logic layer is also responsible for signing the action.

In order to abstract the signing process from the layer (and eventually be able to use it in other packages), the signing process is done through external packages named signature providers.

The protocol repository currently contains two signature provider packages:

- epk-signature ([https://github.com/RequestNetwork/requestNetwork/tree/master/packages/epk-signature](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/epk-signature))
- web3-signature ([https://github.com/RequestNetwork/requestNetwork/tree/master/packages/web3-signature](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/web3-signature))

Both packages use the Elliptic Curve Digital Signature Algorithm (ECDSA) used in Ethereum. web3-signature will connect to Metamask to ask users to sign request while for epk-signature, the private keys are clear and managed manually.

`web3-signature` provider should be used if you want to create a fully-decentralized solution where the users manage their own private key. `epk-signature` provider is adapted when you want to manage the private key for the users and have good flexibility to do it, it's never a good idea to let users handling plain private keys.

### Advanced Logic

Simplicity is one of the most important characteristics we want to achieve in the Protocol. This is why the actions available in Request Logic are the minimal set of actions needed for any kind of request for payment. In the same way, the basic request state is universally common to any request, every request has a payee (a recipient), a currency (what requested), an expected amount (how much requested) and a basic state (accepted, canceled). In order to enable more advanced features for the users, we conceived Advanced Logic.

Advanced Logic is a package that allows the user to define extensions that can be added to the request. An extension is an isolated context inside the request that contains his own actions and his own state. For example, the extension `content-data` allows the user to add any metadata to a request (e.g. the additional data needed for an invoice). The Advanced Logic layer is also where the payment networks allowing payment detection are implemented.

Similar to Request Logic, a specific extension can define different actions related to it. There is the create action of the extension and eventually different update actions. The extension is initialized at the same time as the request and any action of the Request Logic can add extension data. There is a specific action, `AddExtensionData`, in Request Logic, only intended to add extension data to the request with no other side-effect.

![](/img/RequestProtocol/2-AdvancedRequestPresentation.jpg)
*Example of a request with extension data: the payee creates a request with content data and declarative payment information, the payer accepts the request and declares a sent payment in the same time, finally, the payee declares the received payment*

The specification for each extension can be found at this link: [https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs)

## Transaction

This layer converts actions into transactions to be sent to Data-Access. It also handles the encryption.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/transaction-manager](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/transaction-manager)

### Encryption

The transaction layer can encrypt transactions for privacy purposes.

Having privacy can be important for the payee and the payer. In certain case, there could be other parties who would need to read the request. For this need, we implemented a solution where an indefinite number of parties can be added to be able to read the request. They are the stakeholders of the request.

To implement privacy where a indefinite chosen set of stakeholders can read the request we adopted a system composed of two types of key:

- A unique channel key that is shared to all the stakeholders
- A set of private keys where each is privately hold by the stakeholder

The channel key uses Advanced Encryption Standard (AES), this is a technology for symmetric encryption, this means the key to encrypt and decrypt data is the same.

The private keys use Elliptic Curve Integrated Encryption Scheme (ECIES), this is a technology for asymmetric encryption.

When the transaction is received, it will be encrypted only once with the channel key. Every transaction of the same request is encrypted with the same channel key. The set of encrypted transactions forms the channel (hence the name channel key). We made this choice because every request can have a different set of stakeholder (even if the payee and the payer are the same) therefore we want every request to be encrypted with a different key.

The channel key allows the encrypted data to be stored only once. For every stakeholder to be able to read the request, the channel key is encrypted with each stakeholder public key. These encrypted channel keys are publicly available inside the transaction data.

![](/img/RequestProtocol/2-Encryption.jpg)
*The different steps to encrypt the transaction*

## Data-access

Data-Access is the layer that organizes the data in the right format before having them being stored in the storage layer. This layer is similar as the persistence layer in the classical layered architecture pattern.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/data-access](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/data-access)

### Blocks

Heavy communication with the Storage layer can be costly. For example, for solution using Ethereum, every Ethereum transactions cost some gas.

Data-Access layer will gather transactions and batch them into blocks. This solution allows for less communication with the Storage layer. In this case, it will allow consuming less gas for Ethereum transactions.

### Local cache for accessing transaction

Data-Access is also responsible for other side tasks:

- Indexing transactions to allow retrieval
- Accessing transactions through a local cache
- Synchronizing with the storage

The storage phase is only complete when indexing has completed. Because this indexing is an Ethereum transaction, you cannot know in advance how long it will take.

It is the reason that, when a block is created or read from the storage, the transactions inside it will be indexed and kept in a local cache. When a user wants to get information about a request, Data-Access will directly fetch them from this local cache.

Data-Access stays synchronized with the storage layer. For example, it pulls for new blocks, added by other users, in the storage every 10 seconds.

## Storage

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

We use Ethereum to store IPFS hashes. The hashes are stored as event logs of a specific smart contract to stay with a minimal cost.

The Ethereum smart contracts are also used to enforce the fee cost of storing a block to Request. The user will store the size of the file being stored in addition to the hash. A fee, related to this hash, will be paid in Ether when storing the hash.

For our solution, we use additional smart contracts for the fee verification. Using external smart contracts allows us to implement different fee rules in the future. More information, can be found in the ethereum-storage repository.

# Data flow

This section presents flow of data that occurs when some actions are performed in the protocol.

## Creating and updating requests

The next schemas show the data flow that happen when a user perform an `accept` action on a request.

### Request Logic

![](/img/RequestProtocol/3-RequestLogicFlow.jpg)
*Request Logic flow*

![](/img/RequestProtocol/3-AdvancedLogicFlow.jpg)
*Request Logic flow with extension data*

### Transaction

![](/img/RequestProtocol/3-TransactionFlow.jpg)
*Transaction flow without encryption*

![](/img/RequestProtocol/3-TransactionFlowEncrypted.jpg)
*Transaction flow with encryption with 2 stakeholders*

### Data-access

![](/img/RequestProtocol/3-DataAccessFlow.jpg)
*Data-access flow. In this example several transactions are batched into the block, this feature is not yet implemented*

### Storage

![](/img/RequestProtocol/3-StorageFlow.jpg)
*A new block is added into the storage*

## Reading requests

The next schemas show the data flow when the user wants to read the content of a request.

In this case the user call this function of Request Logic: `getRequestFromId(0xaaa)` that reads the request with the request id: 0xaaa

### Storage

There is permanent data flow between Data Access and Storage layers.

For performance purpose, Data Access will periodically synchronize with the current state of Storage. When a new, not synchronized, block is detected, the block content will be dispatched into the Data Access cache.

![](/img/RequestProtocol/4-DataAccessAndStorageFlow.jpg)
*Flow for Data Access synchronization*

### Data-access

![](/img/RequestProtocol/4-DataAccessFlow.jpg)
*Flow from Data-Access. When a user wants to read a request, Data-Access will read its cache without any communication with the storage layer*

### Transaction

![](/img/RequestProtocol/4-TransactionFlow.jpg)
*Flow from Transaction layer. If the request is encrypted, the transactions are decrypted in this layer*

### Request Logic

![](/img/RequestProtocol/4-RequestLogicFlow.jpg)
*Request Logic flow. Request Logic will compute the state of the request based on the list of actions. In this case the increaseExpectedAmount action has been signed by the payer*

Some actions from the Transaction layer can be invalid, this is the role of Request Logic to filter them in order to give the consistent state of the request to the user.

For example, only the payer of the request can increase the expected amount of it. If the action `increaseExpectedAmount` is signed by the payee therefore the action is ignored.

![](/img/RequestProtocol/4-RequestLogicFlowInvalid.jpg)
*In this example the increaseExpectedAmount is signed by the payee, it is therefore invalid. The expectedAmount of the request keeps its initial value: 5*