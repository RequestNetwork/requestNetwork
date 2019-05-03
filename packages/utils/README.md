# @requestnetwork/utils

`@requestnetwork/utils` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of tools shared between the @requestnetwork packages.

- Elliptic curve crypto and signature
  - crypto.normalizeKeccak256Hash()
  - crypto.ecUtils.getAddressFromPrivateKey()
  - crypto.ecUtils.recover()
  - crypto.ecUtils.sign()
  - signature.getIdentityFromSignatureParams()
  - signature.recover()
  - signature.sign()
- Identity
  - identity.areEqual()
  - identity.normalizeIdentityValue()
  - isString
- Miscellaneous
  - deepCopy()
  - deepSort()
  - flatten2DimensionsArray()
  - getCurrentTimestampInSecond()

## Installation

```bash
npm install @requestnetwork/utils
```

## Usage

```javascript
import Utils from '@requestnetwork/utils';

const hash = Utils.crypto.normalizeKeccak256Hash({ exampleData: true });
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
