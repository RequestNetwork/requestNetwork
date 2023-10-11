# @requestnetwork/request-network-sdk

`@requestnetwork/request-network-sdk` is a ES6 typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to interact with the Request blockchain through [Request nodes](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/request-node). This client side library uses Request nodes as servers, connected in HTTP. See the Request node documentation for more details on their API.

## Installation

```bash
npm i @requestnetwork/request-network-sdk
```

## Usage

```javascript
import { RequestNetwork } from '@requestnetwork/request-network-sdk';
```

Please see [Request Network Documentation](https://docs.request.network/get-started/quickstart-node.js) for detailed information on SDK usage.

## Exports

```javascript
import {
  EthereumPrivateKeyDecryptionProvider,
  EthereumPrivateKeySignatureProvider,
  HttpMetaMaskDataAccess,
  PaymentProcessor,
  PaymentReferenceCalculator,
  Request,
  RequestNetwork,
  RequestNetworkBase,
  Types,
  Utils,
  Web3SignatureProvider,
} from '@requestnetwork/request-network-sdk';
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
