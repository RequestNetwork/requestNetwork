---
title: Using Request client library
sidebar_label: Using Request client library
---

You can use the Request Client library to connect to an existing node, for example one you have deployed yourself. You can view an interactive example of using the request client below.

The request client ships both as a commonjs and a UMD module. This means you can use it in node application and in web pages.

Below is an example of using the request-client.js as a commonjs module.

<iframe height="642" style={{width: "100%"}} scrolling="no" title="Simple Request Creation Example" src="https://codepen.io/admreq/embed/preview/joBeqe?height=642&theme-id=dark&default-tab=result" frameborder="no" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href='https://codepen.io/admreq/pen/joBeqe'>Simple Request Creation Example</a> by Adam Dowson
  (<a href='https://codepen.io/admreq'>@admreq</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>

## Using the request-client.js library

`@requestnetwork/request-client.js` is a typescript library part of the [Request protocol](https://github.com/RequestNetwork/requestNetwork). This package allows you to interact with the Request blockchain through [Request nodes](https://github.com/RequestNetwork/requestNetwork-private/blob/development/packages/request-node). This client side library uses Request nodes as servers, connected in HTTP. See the Request node documentation for more details on their API. It ships both as a commonjs and a UMD module. This means you can use it in node application and in web pages.

Use `@requestnetwork/request-client.js` to connect to a node and create requests.

### Installing in nodeJS

```bash
npm install @requestnetwork/request-client.js
```

### Importing

```javascript
import { RequestNetwork } from '@requestnetwork/request-client.js';
```

```javascript
const RequestNetwork = require('@requestnetwork/request-client.js');
```

### Including in Web Application

```markup
<!-- This exposes the library as a global variable: RequestNetwork -->
<script src="https://unpkg.com/@requestnetwork/request-client.js/dist/requestnetwork.min.js"
        charset="utf-8"
        type="text/javascript">
</script>
```

For more information you can check the [request-client.js documentation](https://v2-docs-js-lib.request.network/index.html) or our [github](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/request-client.js) repo.

You can also [follow this example](https://github.com/RequestNetwork/requestNetwork/blob/development/packages/integration-test/test/node-client.test.ts).

## Configure the Node to be used

Connect the library to a node or mock a node for development environments [like explained here](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/request-client.js#configure-which-request-node-to-use).

```javascript
const requestNetwork = new RequestNetwork({
  nodeConnectionConfig: { baseURL: 'http://super-request-node.com' },
});
```

It can be further configured with option from [Axios](https://github.com/axios/axios#request-config).

Alternatively, you can use the request-client in development without a node by using the `useMockStorage` option. When the option `useMockStorage` is `true`, the library will use a mock storage in memory instead of a Request node. It is meant to simplify local development and should never be used in production. Nothing will be persisted on the Ethereum blockchain and IPFS, it will all stay in memory until your program stops.

```javascript
const requestNetwork = new RequestNetwork({ useMockStorage: true });
```

That's it! You can now use the Request client.

## The request-client.js in practice

Let's create a simple application using the request-client.js. We'll create a simple invoice flow between two parties which will include creating, accepting, fetching and updating the expected amount of the invoice.

Firstly, we need to define some parameters for the invoice such as the currency, expected amounts, the payee

```javascript
const requestInfo = {
  currency: 'BTC',
  expectedAmount: '100000000000',
  payee: {
    type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};
```

We will also need to define a payment network which will define which payment address will receive the BTC payment \(see [payment detection](../payment-detection/)\)

```javascript
const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
  },
};
```

We now have everything we need to create an invoice, we can create an invoice like so:

```javascript
const invoice = await requestNetwork.createRequest({
  requestInfo,
  signer: requestInfo.payee,
  paymentNetwork,
});
```

You can now view information on this request

#### Get invoice information from its request ID

```javascript
const invoiceFromRequestID = await requestNetwork.fromRequestId(invoice);

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

We can then use this object to check various fields of the request like `expectedAmount`, `balance`, `payer`, `payee`, and metadata attached to the request.

#### Accepting / cancelling an invoice information

After the invoice has been created, the customer can accept the invoice. First you must create a signature as per [https://github.com/RequestNetwork/requestNetwork/blob/development/packages/types/src/signature-types.ts\#L2](https://github.com/RequestNetwork/requestNetwork/blob/development/packages/types/src/signature-types.ts#L2) - after this you can accept, decline or change the expected amount of the invoice

```javascript
//Accept
await request.accept(signatureInfo);

//Cancel
await request.cancel(signatureInfo);

//Increase the expected amount
await request.decreaseExpectedAmountRequest(amount, signatureInfo);

//Decrease the expected amount
await request.increaseExpectedAmountRequest(amount, signatureInfo);
```

Don't forget, we can then call `fromRequestId` to get the updated invoice information.

### Signing transactions

Transactions are signed through Signature Providers. Today, the providers available for use are:

- [Web3 Signature Provider](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/web3-signature), compatible with metamask
- [Ethereum Private Key Signature Provider](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/epk-signature), using directly the private keys

### Encryption

A request can be encrypted. To manipulate encrypted request you need a Decryption Provider, e.g:

- [Ethereum Private Key Decryption Provider](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/epk-decryption), using directly the private keys
- A Browser extension is under development

#### Create an encrypted request

[Ethereum Private Key Decryption Provider](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/epk-decryption):

```javascript
import EPKDecryptionProvider from '@requestnetwork/epk-decryption';

const decryptionProvider = new EPKDecryptionProvider({
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

```javascript
const payeeEncryptionPublicKey = {
  key: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
},
const payerEncryptionPublicKey = {
  key: '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
},

const invoice = await requestNetwork._createEncryptedRequest({
    requestInfo,
    signer: requestInfo.payee,
    paymentNetwork
  },
  [payeeEncryptionPublicKey, payerEncryptionPublicKey]
);
```

Note: you decryption provider must be able to decrypt the request. Otherwise an error will be trigger after the creation.

#### Get invoice information from its request ID

Like a clear request you will be able to get it from its request id a request. You just need to have a decryption provider that can decrypt the request.

#### Accepting / cancelling an invoice information

Like a clear request you will be able to update a request. You just need to have a decryption provider that can decrypt the request.
