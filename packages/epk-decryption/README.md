# @requestnetwork/epk-decryption

Ethereum Private Key Decryption Provider.

`@requestnetwork/epk-decryption` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).

Implementation of the decryption provider from the private keys.
The decryption provider is used to make decryption in the Request Network Protocol (e.g.: see [Transaction Manager](/packages/transaction-manager)).

It uses the Request Network Protocol concept of `Identity` described in the [request logic specification](/packages/request-logic/specs/request-logic-specification-v2.0.0.md).

## Installation

```bash
npm install @requestnetwork/epk-decryption
```

## Usage

```javascript
import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types'

import EthereumPrivateKeyDecryptionProvider from '@requestnetwork/epk-decryption'

const decryptionParametersExample: EncryptionTypes.IDecryptionParameters = {
  key: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  method: EncryptionTypes.METHOD.ECIES,
};

// Identity from the previous signature parameter
const identityExample: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57'
};

// Construct the provider with a
const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(decryptionParametersExample);

// can list the identity usable
const listOfAvailableIdentity = decryptionProvider.getAllRegisteredIdentities(); // [identityExample]

// can decrypt data with identity
const dataToDecrypt = "02....";
const decryptedData = await decryptionProvider.decrypt(dataToDecrypt, identityExample); // "Decrypted data..."

// can add a new decryption parameters
decryptionProvider.addDecryptionParameters({method: EncryptionTypes.METHOD.ECIES, key: ...});

// can remove a decryption parameters from its identity
decryptionProvider.removeRegisteredIdentity({type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: ...});

// can remove all decryption parameters
decryptionProvider.clearAllRegisteredIdentities();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
