# @requestnetwork/advanced-logic

`@requestnetwork/advanced-logic` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is the default implementation of the Advanced Logic layer. This layer hosts the extensions to the protocol, see Implemented Extensions for the list.

## Installation

```bash
npm install @requestnetwork/advanced-logic
```

## Specifications

Specifications of Advanced Logic can be found [here](/packages/advanced-logic/specs/advanced-logic-specs-0.1.0.md)

## Implemented Extensions

### Content Data

This extension allows linking content data to the request. The content data can be used to give extra information about the request. You can find examples of content data format [here](/packages/data-format).

Specifications of Content Data can be found [here](/packages/advanced-logic/specs/content-data-0.1.0.md)

### Declarative payments

This extension allows the payments and the refunds to be made in any currency.
The payments and refunds are documented by the payer and the payee of the request.

This extension do not ensure payment detection, only a consensus is made between the payer and the payee.

Specifications of Declarative payments can be found [here](/packages/advanced-logic/specs/payment-network-any-declarative-0.1.0.md)

### Address based bitcoin payments

This extension allows the payments and the refunds to be made on the Bitcoin blockchain.

Note: this extension can be used with the bitcoin mainnet and testnet.

Specifications of Address based bitcoin payments can be found [here](/packages/advanced-logic/specs/payment-network-btc-address-based-0.1.0.md)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
