---
title: Handling encryption with the JS library
keywords: [Request, new currency, test network, missing currency, testnet]
description: Learn how to integrate Request network and its features.
---

:::caution
Manipulating private keys must be done with care, losing them can lead to a loss of data and privacy!
:::

A request can be encrypted in order to make its details private to selected stakeholders. In this guide, we won't explain how encryption is managed under the hood. We will mention encryption or decryption of requests with payers' and payee's keys, wherein the reality we use an intermediate symmetric key. See more details on [github](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/transaction-manager/specs/encryption.md)

The encryption is managed by the transaction layer, see more details on [the Request Protocol section](../7-protocol/2-transaction.md).

To manipulate encrypted request you need a Decryption Provider, e.g:

- Ethereum Private Key Decryption Provider (provided by Request for illustration), using directly the private keys. _This provider manipulates private keys in clear, which is not completely secure. Please consider creating your own, see below._
- A browser extension is under development

You can also create your own decryption provider following the [specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/transaction-manager/specs/decryption-provider.md). Feel free to contact us for any help or any idea about it: **Join the Request Hub** [**here**](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)

## Create an encrypted request

Ethereum Private Key Decryption Provider (see on [github](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/epk-decryption))

```typescript
import EPKDecryptionProvider from '@requestnetwork/epk-decryption';

const decryptionProvider = new EPKDecryptionProvider({
  # Warning: private keys should never be stored in clear, this is a basic tutorial
  key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
});

const requestNetwork = new RequestNetwork({
  decryptionProvider,
  signatureProvider,
  useMockStorage: true,
});
```

Then you can create an encrypted request:

```typescript
const payeeEncryptionPublicKey = {
  key:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payerEncryptionPublicKey = {
  key:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

const invoice = await requestNetwork._createEncryptedRequest(
  {
    requestParameters,
    signer: requestParameters.payee,
    paymentNetwork,
  },
  [payeeEncryptionPublicKey, payerEncryptionPublicKey],
);
```

Note: You must give at least one encryption key you can decrypt with the decryption provider. Otherwise, an error will be triggered after the creation.

## Get invoice information from its request ID

Let's step back for a second: the requester sent a request that he encrypted with the payer's public key, as well as with his own, in order to retrieve it later. This is a basic and typical example, but a request can be encrypted with many keys, in order to give access to its status and details.

If the decryption provider knows a private key matching one of the keys used at the creation, it can decrypt it. Like a clear request you will be able to get it from its request id a request.

```typescript
const invoiceFromRequestID = await requestNetwork.fromRequestId(requestId);

const requestData = invoiceFromRequestID.getData();

console.log(requestData);

/* { 
 requestId,
 currency,
 expectedAmount,
 payee,
 payer,
 timestamp,
 extensions,
 version,
 events,
 state,
 creator,
 meta,
 balance,
 contentData,
} */
```

## Accepting/cancelling an invoice information

Like a clear request, you will be able to update it if the decryption provider is instantiated with a matching private key.

```typescript
//Accept
await request.accept(payerIdentity);

//Cancel
await request.cancel(payeeIdentity);

//Increase the expected amount
await request.decreaseExpectedAmountRequest(amount, payeeIdentity);

//Decrease the expected amount
await request.increaseExpectedAmountRequest(amount, payerIdentity);
```
