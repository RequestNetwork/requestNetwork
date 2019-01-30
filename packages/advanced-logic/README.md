# @requestNetwork/advanced-logic

`@requestNetwork/advanced-logic` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is the default implementation of the Advanced Logic layer. This layer hosts the extensions to the protocol, see Implemented Extensions for the list.

## Installation

```bash
npm install @requestNetwork/advanced-logic
```

## Specifications

Specifications of Advanced Logic can be found [here](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/packages/advanced-logic/specs/advanced-logic-specs-0.1.0-DRAFT.md)

## Implemented Extensions

### Content Data

This extension allows linking content data to the request. The content data can be used to give extra information about the request. You can find examples of content data format [here](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/requestNetworkDataFormat).

Specifications of Content Data can be found [here](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/packages/advanced-logic/specs/content-data-0.1.0-DRAFT.md)
todo

### Address based bitcoin payments

This extension allows the payments and the refunds to be made on the Bitcoin blockchain.

Specifications of Address based bitcoin payments can be found [here](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/packages/advanced-logic/specs/payment-network-btc-address-based-0.1.0-DRAFT.md)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/LICENSE)
