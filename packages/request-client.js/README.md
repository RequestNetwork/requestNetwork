# @requestnetwork/request-client.js

`@requestnetwork/request-client.js` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to interact with the Request blockchain through [Request nodes](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-node). This client side library uses Request nodes as servers, connected in HTTP. See the Request node documentation for more details on their API.
It ships both as a commonjs and a UMD module. This means you can use it in node application and in web pages.

## Installation

```bash
# install the request js library
npm install @requestnetwork/request-client.js
# install a request signature provider (e.g: web3-signature to use Metamask)
npm install @requestnetwork/web3-signature
```

## Usage

### Usage as commonjs module

See [packages/usage-examples/src/request-client-js.ts](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/usage-examples/src/request-client-js.ts).

### Usage as UMD module

A global `RequestNetwork` is exposed:

```html
<script src="requestnetwork.min.js"></script>
<script src="web3-signature.min.js"></script>

<script>
  const signatureProvider = new Web3SignatureProvider();

  const requestNetwork = new RequestNetwork.RequestNetwork({
    signatureProvider,
  });

  const request = await requestNetwork.createRequest({
    requestInfo,
    signer,
    paymentNetwork,
  });
</script>
```

Full examples are available in `packages\request-client.js\test\`:

- Simple example of request creation (see [index.html](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/test/index.html))
- Example with signature with metamask (see [index-metamask.html](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/test/index-metamask.html))
- Example with encrypted request (see [index-encryption.html](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/test/index-encryption.html))

### Configure which Request node to use

```javascript
const requestNetwork = new RequestNetwork({
  nodeConnectionConfig: { baseURL: 'http://super-request-node.com/api' },
});
```

It can be further configured with option from [Axios](https://github.com/axios/axios#request-config).

By default, it uses a local node, on http://localhost:3000.

### Use in development, without a node

When the option `useMockStorage` is `true`, the library will use a mock storage in memory instead of a Request node. It is meant to simplify local development and should never be used in production.
Nothing will be persisted on the Ethereum blockchain and IPFS, it will all stay in memory until your program stops.

```javascript
const requestNetwork = new RequestNetwork({ useMockStorage: true });
```

## Guide

We are currently writing the full API reference and more detailed guides. This section will be updated. If you need help in the meantime, [join the Request Hub Slack](https://request-slack.herokuapp.com/) and come chat with us.

### Create a request

```javascript
const request = await requestNetwork.createRequest({
  requestInfo,
  signer,
  paymentNetwork,
  contentData,
  topics,
});

// wait the confirmation with a promise
await request.waitForConfirmation();

// or wait the confirmation with an event
request.on('confirmed', confirmedRequest => {
  // ...
});
```

- `requestInfo`: [IRequestInfo](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L42)
- `signer`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `paymentNetwork`: [IPaymentNetworkCreateParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L43)
- `contentData`: any - optional [content data](#content-data) of the request.
- `topics`: string[] - optional strings used to index the request.

### Create an encrypted request

```javascript
// a public key to encrypt the request with
const encryptionParameters = {
  key:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: EncryptionTypes.METHOD.ECIES,
};
// another public key to encrypt the request with
const encryptionParameters2 = {
  key:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  method: EncryptionTypes.METHOD.ECIES,
};

const request = await requestNetwork.createEncryptedRequest(
  {
    requestInfo,
    signer,
    paymentNetwork,
    contentData,
    topics,
  },
  [encryptionParameters, encryptionParameters2],
);

// wait the confirmation with a promise
await request.waitForConfirmation();

// or wait the confirmation with an event
request.on('confirmed', confirmedRequest => {
  // ...
});
```

- `requestInfo`: [IRequestInfo](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L42)
- `signer`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `paymentNetwork`: [IPaymentNetworkCreateParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L43)
- `contentData`: any - optional [content data](#content-data) of the request.
- `topics`: string[] - optional strings used to index the request.
- `encryptionParameters`: [RequestNetwork.Types.Encryption.IEncryptionParameters[]](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/encryption-types.ts#L2) - array of encryption parameters

### Get a request from its ID

```javascript
const requestFromId = await requestNetwork.fromRequestId(requestId);
```

- `requestId`: string

### Get all requests linked to an identity

```javascript
const identity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
};

// Get only the request updated in this timestamp boundaries (in second)
const updatedBetween = {
  from: 1546300800,
  to: 1548979200,
};

const requestsFromIdentity = await requestNetwork.fromIdentity(identity, updatedBetween);
```

- `identity`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `updatedBetween`
  - `from`: number - get requests updated from this timestamp on
  - `to`: number - get requests updated before this timestamp

### Get all requests linked to a topic

```javascript
const topic = 'any_topic';

// Get only the request updated in this timestamp boundaries (in second)
const updatedBetween = {
  from: 1546300800,
  to: 1548979200,
};

const requestsFromIdentity = await requestNetwork.fromTopic(topic, updatedBetween);
```

- `topic`: string
- `updatedBetween`
  - `from`: number - get requests updated from this timestamp on
  - `to`: number - get requests updated before this timestamp

### Get encrypted requests

To get encrypted request you must use a decryption provider.

```bash
# install a request decryption provider (e.g: epk-decryption). If you need to get encrypted requests.
npm install @requestnetwork/epk-decryption
```

```html
<script src="epk-decryption.min.js"></script>

<script>
  const decryptionParameters = {
    key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
    method: EncryptionTypes.METHOD.ECIES,
  };

  const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(decryptionParameters);

  const requestNetwork = new RequestNetwork.RequestNetwork({
    ...,
    decryptionProvider,
  });

  // then use the function as before
  const requestFromId = await requestNetwork.fromRequestId(requestId);
  const requestsFromIdentity = await requestNetwork.fromTopic(topic, updatedBetween);
</script>
```

### Accept a request

```javascript
const requestData = await request.accept(signerIdentity, refundInformation);

// wait the confirmation with an event
requestData.on('confirmed', confirmedRequestData => {
  // ...
});
```

- `signerIdentity`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `refundInformation`: any - Optional refund information to add

### Cancel a request

```javascript
await request.cancel(signerIdentity, refundInformation);

// wait the confirmation with an event
requestData.on('confirmed', confirmedRequestData => {
  // ...
});
```

- `signerIdentity`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `refundInformation`: any - Optional refund information to add

### Increase the expected amount of a request

```javascript
await request.increaseExpectedAmountRequest(amount, signerIdentity, refundInformation);

// wait the confirmation with an event
requestData.on('confirmed', confirmedRequestData => {
  // ...
});
```

- `amount`: string
- `signerIdentity`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `refundInformation`: any - Optional refund information to add

### Reduce the expected amount of a request

```javascript
await request.reduceExpectedAmountRequest(amount, signerIdentity, paymentInformation);

// wait the confirmation with an event
requestData.on('confirmed', confirmedRequestData => {
  // ...
});
```

- `amount`: string
- `signerIdentity`: [RequestNetwork.Types.Identity.IIdentit](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `paymentInformation`: any - Optional payment information to add

### Get a request data

```javascript
const requestData = request.getData();
/*
{ 
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
  meta, // see "Metadata of a request"
  balance,
  contentData,
  pending, // see "Pending state of a request"
}
*/
```

`requestData.request`: [IRequestData](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L17)

#### Pending state of a request

Requests have a `pending` attribute containing all the changes from transactions still pending.

In this example, the request is already created but the `accept` and an `increaseExpectedAmount` actions are still pending in the storage (e.g: the ethereum transaction is not mined yet)

```javascript
{
  ...
  state: "created",
  currency: "BTC",
  expectedAmount: "1000",
  payee: {...},
  payer: {...},
  requestId:
    "01061052b398b00e08b5fd6e0403a3c83a1fd6b47c21ae57a219866d54d64d74d1",
  events: [
    {
      name: "create",
      ...
    }
  ],
  pending: {
    state: "accepted",
    expectedAmount: "1200",
    events: [
      {
        name: "accept",
        ...
      },
      {
        name: "increaseExpectedAmount",
        ...
      }
    ]
  }
}
```

In the next example, the creation is still pending:

```javascript
{
  currency: "BTC",
  expectedAmount: "1000",
  payee: {...},
  payer: {...},
  requestId:
    "01061052b398b00e08b5fd6e0403a3c83a1fd6b47c21ae57a219866d54d64d74d1",
  state: "pending",
  currencyInfo: { type: "BTC", value: "BTC" },
  pending: { state: "created" }
}
```

#### Metadata of a request

In the object returned by `request.getData();`, the property `meta` contains the metadata of the request:

```javascript
{
  ...
  meta: {
    ignoredTransactions: [
      {
        reason // reason why the transaction has been ignored
        transaction // the ignored transaction
      }
    ],
    transactionManagerMeta: {
      dataAccessMeta: {
        storageMeta: [
          {
            ethereum: {
              blockConfirmation // number of confirmation of the block from where the data comes from
              blockNumber // the block number
              blockTimestamp // the block timestamp
              cost // total cost in wei paid to submit the block on ethereum
              fee // request fees paid in wei
              gasFee // ethereum gas fees paid in wei
              networkName // ethereum network name
              smartContractAddress // address of the smartcontract where the hash is stored
              transactionHash // ethereum transaction hash that stored the hash
            },
            ipfs: {
              size // size of the ipfs content of the block
            },
            storageType  // type of the storage (for now, always "ethereumIpfs")
            timestamp: // timestamp of the data (for now, always equals to the ethereum.blockTimestamp)
          }
        ],
        transactionsStorageLocation: [
          // location of the data used to interpret the request
        ]
      }
    }
  }
}
```

### Compute a request ID before it is created

```javascript
const requestId = await requestNetwork.computeRequestId({
  requestInfo,
  signer,
  paymentNetwork,
  contentData,
  topics,
});
```

- `requestInfo`: [IRequestInfo](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L42)
- `signer`: [RequestNetwork.Types.Identity.IIdentity](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/identity-types.ts#L2)
- `paymentNetwork`: [IPaymentNetworkCreateParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-client.js/src/types.ts#L43)
- `contentData`: any - optional [content data](#content-data) of the request.
- `topics`: string[] - optional strings used to index the request.

> Important: As the `requestId` is a hash of the request data, you should set `requestInfo.timestamp`, using `Utils.getCurrentTimestampInSecond`. Otherwise, it can have a different timestamp when computing the ID and when actually creating the request.

### Content Data

A Request can have an optional Content Data.
Content Data can be any type of data that can safely be JSON stringified (check the [JSON.stringify() documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description) for more details).

This Content Data will be stored with the request, allowing relevant information about the request to be shared.

Examples of standardized data formats that can be used in the request Content Data can be found at the [data-format](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/data-format/README.md) package.

### Payment and Refund detections

If a payment network has been given to the request, the payment detection can be done.

From the information provided in payment network, the library will feed the property `balance` of the request with:

- `balance`: the sum of the amount of all payments minus the sum of amount of all refunds
- `events`: all the payments and refunds events with the amount, timestamp etc...

The payment networks available are:

- `Types.Payment.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED` ('pn-bitcoin-address-based'): handle Bitcoin payments associated to a BTC address to the request, every transaction hitting this address will be consider as a payment. Optionally, the payer can provide a BTC address for the refunds. Note that **the addresses must be used only for one and only one request** otherwise one transaction will be considered as a payment for more than one request. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-btc-address-based-0.1.0.md))
- `Types.Payment.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED` ('pn-testnet-bitcoin-address-based'): Same as previous but for the bitcoin testnet (for test purpose)
- `Types.Payment.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED`('pn-erc20-address-based'): Same as `BITCOIN_ADDRESS_BASED`, for ERC20 payments.
- `Types.Payment.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT`('pn-erc20-proxy-contract'): uses an intermediary contract to document which request is being paid, through the `PaymentReference`. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-erc20-address-based-0.1.0.md))
- `Types.Payment.PAYMENT_NETWORK_ID.ETH_INPUT_DATA`('pn-eth-input-data'): uses the transaction input data to pass the `PaymentReference`. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-eth-input-data-0.1.0.md))
- `Types.Payment.PAYMENT_NETWORK_ID.DECLARATIVE`('pn-any-declarative'): a manual alternative, where payer can declare a payment sent, and payee can declare it received, working for any currency. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-any-declarative-0.1.0.md))

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
