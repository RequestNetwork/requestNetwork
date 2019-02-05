# @requestnetwork/client-side

`@requestnetwork/client-side` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to interact with the Request blockchain through [Request nodes](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-node). This client side library uses Request nodes as servers, connected in HTTP. See the Request node documentation for more details on their API.
It ships both as a commonjs and a UMD module. This means you can use it in node application and in web pages.

## Installation

```bash
npm install @requestnetwork/client-side
```

## Usage

### Usage as commonjs module

```javascript
import { RequestNetwork } from '@requestnetwork/client-side';
import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

const signatureInfo: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const requestCreationHash: RequestLogicTypes.IRequestLogicCreateParameters = {
  currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const topics = [
  '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
];

const requestNetwork = new RequestNetwork();

const { request } = await requestNetwork.createRequest(requestCreationHash, signatureInfo, topics);
```

### Usage as UMD module

A global `RequestNetwork` is exposed:

```html
<script src="requestnetwork.min.js"></script>

<script>
  const requestNetwork = new RequestNetwork.RequestNetwork();

  const { request } = await requestNetwork.createRequest(
    requestCreationHash,
    signatureInfo,
    topics,
  );
</script>
```

A full example is available in `packages\client-side\test\index.html`

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
const { request } = await requestNetwork.createRequest(requestCreationHash, signatureInfo, topics);
```

`requestCreationHash`: [RequestLogicTypes.IRequestLogicCreateParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/request-logic-types.ts#L119)
`signatureInfo`: [SignatureTypes.ISignatureParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/signature-types.ts#L2)
`topics`: string[]

### Get a request from its ID

```javascript
const requestFromId = requestNetwork.fromRequestId(requestId);
```

`requestId`: string

### Accept a request

```javascript
await request.accept(signatureInfo);
```

`signatureInfo`: [SignatureTypes.ISignatureParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/signature-types.ts#L2)

### Cancel a request

```javascript
await request.cancel(signatureInfo);
```

`signatureInfo`: [SignatureTypes.ISignatureParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/signature-types.ts#L2)

### Increase the expected amount of a request

```javascript
await request.increaseExpectedAmountRequest(amount, signatureInfo);
```

`signatureInfo`: [SignatureTypes.ISignatureParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/signature-types.ts#L2)
`amount`: string

### Reduce the expected amount of a request

```javascript
await request.reduceExpectedAmountRequest(amount, signatureInfo);
```

`signatureInfo`: [SignatureTypes.ISignatureParameters](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/signature-types.ts#L2)
`amount`: string

### Get a request data

```javascript
const { result } = await request.getData();
```

`result.request`: [IRequestLogicRequest](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/request-logic-types.ts#L70)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/master/LICENSE)
