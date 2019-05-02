# @requestnetwork/request-client.js

`@requestnetwork/request-client.js` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to interact with the Request blockchain through [Request nodes](/packages/request-node). This client side library uses Request nodes as servers, connected in HTTP. See the Request node documentation for more details on their API.
It ships both as a commonjs and a UMD module. This means you can use it in node application and in web pages.

## Installation

```bash
npm install @requestnetwork/request-client.js
```

## Usage

### Usage as commonjs module

```typescript
import * as RequestNetwork from '@requestnetwork/request-client.js';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';

// payee information
const payeeSignatureInfo = {
  method: RequestNetwork.Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
const payeeIdentity = {
  type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

// Signature providers
const signatureProvider = new EthereumPrivateKeySignatureProvider(payeeSignatureInfo);

const requestInfo: RequestNetwork.Types.RequestLogic.ICreateParameters = {
  currency: RequestNetwork.Types.RequestLogic.CURRENCY.BTC,
  expectedAmount: '100000000000',
  payee: payeeIdentity,
  payer: {
    type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const paymentNetwork: RequestNetwork.Types.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
  },
};

(async (): Promise<void> => {
  const requestNetwork = new RequestNetwork.RequestNetwork({
    signatureProvider,
  });

  const request = await requestNetwork.createRequest({
    paymentNetwork,
    requestInfo,
    signer: payeeIdentity,
  });

  console.log(request);
})();
```

### Usage as UMD module

A global `RequestNetwork` is exposed:

```html
<script src="requestnetwork.min.js"></script>

<script>
  const requestNetwork = new RequestNetwork.RequestNetwork();

  const request = await requestNetwork.createRequest({
    requestInfo,
    signer,
    paymentNetwork,
  });
</script>
```

A full example is available in `packages\request-client.js\test\index.html` (see [here](/packages/request-client.js/test/index.html))

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
```

- `requestInfo`: [RequestLogicTypes.ICreateParameters](/packages/types/src/request-logic-types.ts#L145)
- `signatureInfo`: [SignatureTypes.ISignatureParameters](/packages/types/src/signature-types.ts#L2)
- `paymentNetwork`: [IPaymentNetworkCreateParameters](/packages/request-client.js/src/types.ts#L43)
- `contentData`: any - optional data content of the request.
- `topics`: string[] - optional strings used to index the request.

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

- `identity`: [IIdentity](/packages/types/src/identity-types.ts#L2)
- `updatedBetween`
  - `from`: number - get requests updated from this timestamp on
  - `to`: number - get requests updated before this timestamp

### Get all requests linked to a topic

```javascript
const identity = 'any_topic';

// Get only the request updated in this timestamp boundaries (in second)
const updatedBetween = {
  from: 1546300800,
  to: 1548979200,
};

const requestsFromIdentity = await requestNetwork.fromTopic(identity, updatedBetween);
```

- `identity`: [IIdentity](/packages/types/src/identity-types.ts#L2)
- `updatedBetween`
  - `from`: number - get requests updated from this timestamp on
  - `to`: number - get requests updated before this timestamp

### Accept a request

```javascript
await request.accept(signatureInfo);
```

- `signatureInfo`: [SignatureTypes.ISignatureParameters](/packages/types/src/signature-types.ts#L2)

### Cancel a request

```javascript
await request.cancel(signatureInfo);
```

- `signatureInfo`: [SignatureTypes.ISignatureParameters](/packages/types/src/signature-types.ts#L2)

### Increase the expected amount of a request

```javascript
await request.increaseExpectedAmountRequest(amount, signatureInfo);
```

- `amount`: string
- `signatureInfo`: [SignatureTypes.ISignatureParameters](/packages/types/src/signature-types.ts#L2)

### Reduce the expected amount of a request

```javascript
await request.reduceExpectedAmountRequest(amount, signatureInfo);
```

- `amount`: string
- `signatureInfo`: [SignatureTypes.ISignatureParameters](/packages/types/src/signature-types.ts#L2)

### Get a request data

```javascript
const requestData = await request.getData();
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
  meta,
  balance,
  contentData,
}
*/
```

`requestData.request`: [IRequestData](/packages/request-client.js/src/types.ts#L17)

### Payment and Refund detections

If a payment network has been given to the request, the payment detection can be done.

From the information provided in payment network, the library will feed the property `balance` of the request with:

- `balance`: the sum of the amount of all payments minus the sum of amount of all refunds
- `events`: all the payments and refunds events with the amount, timestamp etc...

The payment networks available are:

- `Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED` ('pn-bitcoin-address-based'): handle Bitcoin payments associated to a BTC address to the request, every transaction hitting this address will be consider as a payment. Eventually, the payer can provide a BTC address for the refunds. Note that **the addresses must be used only for one and only one request** otherwise one transaction will be considered as a payment for more than one request. (see [the specification](/packages/advanced-logic/specs/payment-network-btc-address-based-0.1.0-DRAFT.md))
- `Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED` ('pn-testnet-bitcoin-address-based'): Same as previous but for the bitcoin testnet (for test purpose)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
