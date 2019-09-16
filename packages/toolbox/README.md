# @requestnetwork/toolbox

`@requestnetwork/toolbox` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of miscellaneous tools.
This package can use other package of the monorepo, but the other packages cannot use toolbox.

## Installation

```bash
npm install @requestnetwork/toolbox
```

## Usage

### Create request

Create a request. Only the amount can be specified, optionally.

- Currency: BTC
- Payee: 0x627306090abab3a6e1400e9345bc60c78a8bef57
- Payer: 0xf17f52151ebef6c7334fad080c5704d77216b732
- Amount (default): 1000

#### As a package

```javascript
import { CreateRequest } from '@requestnetwork/toolbox';

CreateRequest.createTestRequest();
CreateRequest.createTestRequest(12);
```

#### In the CLI

```bash
yarn run:create
yarn run:create 12
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
