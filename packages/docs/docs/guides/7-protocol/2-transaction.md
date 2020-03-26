---
title: Transaction
keywords: [Request protocol, Transaction, Encryption]
description: Learn how to integrate Request network and its features.

---

This layer converts actions into transactions to be sent to Data-Access. It also handles the encryption.

[https://github.com/RequestNetwork/requestNetwork/tree/master/packages/transaction-manager](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/transaction-manager)

### Encryption

The transaction layer can encrypt transactions for privacy purposes.

Having privacy can be important for the payee and the payer. In certain cases, there could be other parties who would need to read the request. For this need, we implemented a solution where an indefinite number of parties can be added to be able to read the request. They are the stakeholders of the request.

To implement privacy where an indefinite chosen set of stakeholders can read the request we adopted a system composed of two types of key:

- A unique channel key that is shared to all the stakeholders
- A set of private keys where each is privately held by the stakeholder

The channel key uses Advanced Encryption Standard (AES), this is a technology for symmetric encryption, this means the key to encrypt and decrypt data is the same.

The private keys use Elliptic Curve Integrated Encryption Scheme (ECIES), this is a technology for asymmetric encryption.

When the transaction is received, it will be encrypted only once with the channel key. Every transaction of the same request is encrypted with the same channel key. The set of encrypted transactions forms the channel (hence the name channel key). We made this choice because every request can have a different set of stakeholders (even if the payee and the payer are the same) therefore we want every request to be encrypted with a different key.

The channel key allows encrypted data to be stored only once. For every stakeholder to be able to read the request, the channel key is encrypted with each stakeholder's public key. These encrypted channel keys are publicly available inside the transaction data.

![](/img/RequestProtocol/2-Encryption.jpg)
*The different steps to encrypt the transaction*
