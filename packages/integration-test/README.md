# @requestnetwork/integration-test

`@requestnetwork/integration-test` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It tests that the layers on the Request Network system work together:

- @requestnetwork/advanced-logic
- @requestnetwork/request-logic
- @requestnetwork/transaction-manager
- @requestnetwork/data-access
- @requestnetwork/ethereum-storage
- @requestnetwork/types

## Usage

To run all the tests:

```bash
npm run test
```

## Tests Suites

### Integration test of the layers

It tests the direct integration of the layers:

- @requestnetwork/advanced-logic
- @requestnetwork/data-access
- @requestnetwork/ethereum-private-key-signature-provider
- @requestnetwork/ethereum-storage
- @requestnetwork/request-logic
- @requestnetwork/transaction-manager

```bash
npm run test:layers
```

### Integration test of the node and library

It tests the integration of the Request node and the client side library:

- @requestnetwork/client-side
- @requestnetwork/request-node

```bash
npm run test:node
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/LICENSE)
