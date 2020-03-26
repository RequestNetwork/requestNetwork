---
title: Data flow
keywords: [Request protocol, IPFS, Ethereum]
description: Learn how to integrate Request network and its features.

---

This page presents the flow of data that occurs when some actions are performed in the protocol.

## Creating and updating requests

The next schemas show the data flow that happens when a user performs an `accept` action on a request.

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

There is a permanent data flow between Data Access and Storage layers.

For performance purposes, Data Access will periodically synchronize with the current state of Storage. When a new, not synchronized block is detected, the block content will be dispatched into the Data Access cache.

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
*Request Logic flow. Request Logic will compute the state of the request based on the list of actions. In this case, the increaseExpectedAmount action has been signed by the payer*

Some actions from the Transaction layer can be invalid, this is the role of Request Logic to filter them in order to give the consistent state of the request to the user.

For example, only the payer of the request can increase the expected amount of it. If the action `increaseExpectedAmount` is signed by the payee therefore the action is ignored.

![](/img/RequestProtocol/4-RequestLogicFlowInvalid.jpg)
*In this example the increaseExpectedAmount is signed by the payee, it is therefore invalid. The expectedAmount of the request keeps its initial value: 5*
