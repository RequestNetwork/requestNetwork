---
title: Introduction to the Request Protocol
keywords: [Request protocol, IPFS, Ethereum]
description: Learn how to integrate Request network and its features.

---

Request is an open and unique database for payment requests including invoices or individual payment requests. It is aimed to be universal and to power products used by different companies from startups to large organizations, from the private to the public sector.

The Request Protocol is the core of Request. It's the bottom layer that defines and handles the data of a request and persists them to a distributed ledger to make Request open, trustless, secure and resilient.

This section is aimed at helping you understand how the protocol is structured, how it works and how it meets its requirements. It is particularly useful if you want to propose changes or implement it yourself.

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

The following pages present the first implementation of the protocol used for the released version of Request V2 on mainnet.
