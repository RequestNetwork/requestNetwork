---
title: Glossary
keywords:
---

# Ecosystem

## Request Portal API

The Request Portal is a software built on top of the Request Protocol that allows third party software to easily integrate Request, all the private keys to create requests and perform actions to them are stored by Request and can be managed through OAuth. The Request Portal API is an API built on top of the Request Portal.

## Request Client

The Request Client is a Javascript library made to interact directly with the Request Protocol. The Request Client connects to a Request Node.

## Request Node

Request Nodes are HTTP servers exposing an API used to allow Request Client to communicate with the Request Protocol. These servers abstract the complexity of IPFS and Ethereum used by the current implementation of the Request Protocol.

## Request Protocol

The Request Protocol is the underlying protocol to make Request work. The protocol stores all the request information and actions performed to them on a distributed ledger.

# Request Protocol

## Action

An action is signed data added by a request's stakeholder into the Request Protocol that creates or updates the state of a request. The creation of a request is considered as an action and a request can be represented by a list of actions.

## Balance

When using a payment network, the balance is the current amount paid for a request. This balance is not the current balance of a specific account but is determined by the payment detection method of the payment network used.

A request with no payment network provided doesn't have a balance.

## Confirmed/Pending action

The Protocol relies on other blockchain technologies to ensure data immutability. Most blockchain doesn't offer transaction instant finality. This means that when performing an action on the request, this action can't directly be confirmed as effective.

As long as the action hasn't been persisted and is not confirmed, the action is marked as "pending".

## Encryption provider

An encryption provider is an object that allows to abstract the encryption of actions. It can be used to perform the action's encryption on a distant server.

## Extension

An extension is a set of actions that extends the feature of a request. A request without extension is a basic request for payment with a payee, a currency and a requested amount. The extension allows for more advanced features.

## Identity

The identity is what defines a stakeholder of a request that allows signing or encrypting the request actions. The identity is the public data that identifies the stakeholder.

## Payment Detection

A payment detection is a method defined by the payment network to determine the current balance of a request.

## Payment Network

A payment network is a predefined set of rules to agree on the balance of a request. The payment network is defined during the creation of the request.

A payment network is generally related to one currency but it's not always the case (the Declarative payment network is currency agnostic)

## Request Data

The request data is the current state of a request, the data of the request after having applied all the confirmed actions on it.

## Request Id

The request Id is the number that uniquely identifies a request. This number is computed from the hash of the request creation action.

## Signature Provider

A signature provider is an object that allows to abstract identity management and action signatures. It can be used to perform the action's signature on a distant server.

## Stakeholder

A request stakeholder is a party involved with the request. Stakeholders are generally the payer and the payee of the request and perform actions on it but for encrypted requests, stakeholders are any party that can read the request.

## Topic

A topic is a string that is used to index a request. This topic is used for request retrieval. Several requests can share the same topic.

Every request has its request id and its payee identity as topics (and the payer identity if it is defined). Any custom topic can be appended for a request.

# Blockchain, Cryptography

## Confirmation

Confirmation means that the blockchain transaction has been verified by the network. This happens through a process known as mining, in a proof-of-work system (e.g. Bitcoin). Once a transaction is confirmed, it cannot be reversed. 

## Ether

Ether is the native token of the Ethereum blockchain which is used to pay for transaction fees, miner rewards, and other services on the network. Beware that Ether and Ethereum don't have the same meaning, Ether is the currency and Ethereum is the name of the network (unlike for Bitcoin where the name means the network and the currency).

## IPFS

The Inter-Planetary File System (IPFS) is a protocol and peer-to-peer network for storing and sharing data in a distributed file system. IPFS uses content-addressing to uniquely identify each file in a global namespace connecting all computing devices.

IPFS is used by the Request Protocol to ensure data immutability.

## Multi-signature

Multi-signature (multisig) addresses allow multiple parties to require more than one key to authorize a transaction. The needed number of signatures is agreed at the creation of the address. Multi-signature addresses have a much greater resistance to theft.

## Private Key

A private key is a large number that allows you to sign or decrypt messages. Private keys can be thought of as a password; private keys must never be revealed to anyone but you, as they allow you to spend the funds from your wallet through a cryptographic signature.
