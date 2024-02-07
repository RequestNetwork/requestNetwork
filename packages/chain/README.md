# @requestnetwork/chain

`@requestnetwork/chain` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of tools for the currencies and chains shared between the @requestnetwork packages.

## Installation

```bash
npm install @requestnetwork/chain
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

### Adding a new chain

Supported chains are listed in `src/chains`:

- `src/chains/btc/data` for BTC type chains
- `src/chains/evm/data` for EVM type chains
- `src/chains/near/data` for NEAR type chains

The chain names are subjective, but they are unique and uniform across all Request Network packages.
They are formatted with the kebab-case naming convention.

In order to add a new chain, first create a file `[nameOfTheChain].ts` in the correct directory.
Its internal structure should conform with the corresponding type, respectively:

- `BtcChain`
- `EvmChain`
- `NearChain`

These types are described in the `index.ts` file of each chain subdirectory.
Please add the `testnet: true` property for staging chains.

## License

[MIT](/LICENSE)
