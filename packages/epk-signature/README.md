# @requestnetwork/epk-signature

Ethereum Private Key Signature Provider.

`@requestnetwork/epk-signature` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).

Implementation of the signature provider from the private keys.
The signature provider is used to make signature in the Request Network Protocol (e.g.: see [Request Logic](/packages/request-logic)).

It uses the Request Network Protocol concepts of `Identity` and `Signature` described in the [request logic specification](/packages/request-logic/specs/request-logic-specification-v2.0.0.md).

## Installation

```bash
npm install @requestnetwork/epk-signature
```

## Usage

```javascript
import { IdentityTypes,  SignatureTypes } from '@requestnetwork/types'

import EthereumPrivateKeySignatureProvider from '@requestnetwork/epk-signature'

const signatureParametersExample: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

// Identity from the previous signature parameter
const identityExample: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57'
};

// Construct the provider with a
const signatureProvider = new EthereumPrivateKeySignatureProvider(signatureParametersExample);

// can list the identity usable
const listOfAvailableIdentity = signatureProvider.getAllRegisteredIdentities(); // [identityExample]

// can sign data with identity
const dataToSign = { ... };
const signedData = await signatureProvider.sign(dataToSign, identityExample); // { data: { ... }, signature: { method: SignatureTypes.METHOD.ECDSA, value: '0x...' }}

// can add a new signature parameters
signatureProvider.addSignatureParameters({method: ..., privateKey: ...});

// can remove a signature parameters from its identity
signatureProvider.removeRegisteredIdentity({type: ..., value: ...});

// can remove all signature parameters
signatureProvider.clearAllRegisteredIdentities();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
