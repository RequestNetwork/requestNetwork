# @requestnetwork/epk-cipher

Ethereum Private Key Cipher Provider.

`@requestnetwork/epk-cipher` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).

Implementation of the cipher provider from the private keys.
The cipher provider is used to make encryption and decryption in the Request Network Protocol (e.g.: see [Transaction Manager](/packages/transaction-manager)).

It uses the Request Network Protocol concept of `Identity` described in the [request logic specification](/packages/request-logic/specs/request-logic-specification.md).

## Installation

```bash
npm install @requestnetwork/epk-cipher
```

## Usage

```javascript
import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types'

import EthereumPrivateKeyCipherProvider from '@requestnetwork/epk-cipher'

const cipherParametersExample: EncryptionTypes.ICipherParameters = {
  key: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  method: EncryptionTypes.METHOD.ECIES,
};

// Identity from the previous signature parameter
const identityExample: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57'
};

// Construct the provider with a
const cipherProvider = new EthereumPrivateKeyCipherProvider(cipherParametersExample);

// can list the identity usable
const listOfAvailableIdentity = cipherProvider.getAllRegisteredIdentities(); // [identityExample]

// can decrypt data with identity
const dataToDecrypt = "02....";
const decryptedData = await cipherProvider.decrypt(dataToDecrypt, identityExample); // "Decrypted data..."

// can add a new decryption parameters
cipherProvider.addDecryptionParameters({method: EncryptionTypes.METHOD.ECIES, key: ...});

// can remove a cipher parameters from its identity
cipherProvider.removeRegisteredIdentity({type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: ...});

// can remove all cipher parameters
cipherProvider.clearAllRegisteredIdentities();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
