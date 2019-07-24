# @requestnetwork/web3-signature

Web3 Signature Provider.

`@requestnetwork/web3-signature` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).

Implementation of the signature provider from the web3 tools.
The signature provider is used to make signature in the Request Network Protocol (e.g.: see [Request Logic](/packages/request-logic)).
This provider allows users to use Metamask to sign data.

It uses the Request Network Protocol concepts of `Identity` and `Signature` described in the [request logic specification](/packages/request-logic/specs/request-logic-specification-v2.0.0.md).

## Installation

```bash
npm install @requestnetwork/web3-signature
```

## Usage

```javascript
import {
  IdentityTypes,
  SignatureTypes
} from '@requestnetwork/types'

import Web3SignatureProvider from '@requestnetwork/web3-signature'

// Identity from the previous signature parameter
const identityExample: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57'
};

// Construct the provider with a
const signatureProvider = new Web3SignatureProvider(web3.currentProvider);

// can sign data with identity
const dataToSign = { ... };
const signedData = signatureProvider.sign(dataToSign, identityExample);
/*
{
  data: { ... },
  signature: {
    method: SignatureTypes.METHOD.ECDSA,
    value: '0x...'
  }
}
*/
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
