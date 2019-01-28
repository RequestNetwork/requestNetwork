# @requestNetwork/types

`@requestNetwork/types` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is the collection of typescript types shared across @requestnetwork packages.

## Installation

```bash
npm install @requestNetwork/types --save-dev
```

## Usage

```javascript
import { Identity as IdentityTypes, Signature as SignatureTypes } from '@requestnetwork/types';

const signatureMethod = SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA;
const identityType = IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS;
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/LICENSE)
