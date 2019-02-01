<img src="https://github.com/RequestNetwork/Request/raw/master/Hubs/Marketing%20and%20design/logo-horizontal.png" width="400px" >

---

[Request Network][website-url] is a decentralized network built on top of Ethereum, which allows anyone, anywhere to request a payment. A full description of the protocol may be found in our [whitepaper][whitepaper-url].

This repository contains all the Request Network developer tools written in TypeScript.

Join the [Request Hub][requesthub-slack-url] to get in touch with us.

[website-url]: https://request.network
[whitepaper-url]: https://request.network/assets/pdf/request_whitepaper.pdf
[requesthub-slack-url]: https://request-slack.herokuapp.com/

### Published Packages

| Package                                                                                                        | Version                                                                                                                                                                                   | Description                                                     |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`@requestnetwork/advanced-logic`](/packages/advanced-logic)                                                   | [![npm](https://img.shields.io/npm/v/@requestnetwork/advanced-logic.svg)](https://www.npmjs.com/package/@requestnetwork/advanced-logic)                                                   | Extensions to the protocol                                      |
| [`@requestnetwork/client-side`](/packages/client-side)                                                         | [![npm](https://img.shields.io/npm/v/@requestnetwork/client-side.svg)](https://www.npmjs.com/package/@requestnetwork/client-side)                                                         | Library to use Request nodes as servers                         |
| [`@requestnetwork/data-access`](/packages/data-access)                                                         | [![npm](https://img.shields.io/npm/v/@requestnetwork/data-access.svg)](https://www.npmjs.com/package/@requestnetwork/data-access)                                                         | Indexing an batching of transactions                            |
| [`@requestnetwork/data-format`](/packages/data-format)                                                         | [![npm](https://img.shields.io/npm/v/@requestnetwork/data-format.svg)](https://www.npmjs.com/package/@requestnetwork/data-format)                                                         | Standards for invoice data                                      |
| [`@requestnetwork/ethereum-private-key-signature-provider`](/packages/ethereum-private-key-signature-provider) | [![npm](https://img.shields.io/npm/v/@requestnetwork/ethereum-private-key-signature-provider.svg)](https://www.npmjs.com/package/@requestnetwork/ethereum-private-key-signature-provider) | Sign requests using private keys                                |
| [`@requestnetwork/ethereum-storage`](/packages/ethereum-storage)                                               | [![npm](https://img.shields.io/npm/v/@requestnetwork/ethereum-storage.svg)](https://www.npmjs.com/package/@requestnetwork/ethereum-storage)                                               | Storage of Request data on Ethereum and IPFS                    |
| [`@requestnetwork/integration-test`](/packages/integration-test)                                               | [![npm](https://img.shields.io/npm/v/@requestnetwork/integration-test.svg)](https://www.npmjs.com/package/@requestnetwork/integration-test)                                               | Integration test for the Request system                         |
| [`@requestnetwork/prototype-estimator`](/packages/prototype-estimator)                                         | [![npm](https://img.shields.io/npm/v/@requestnetwork/prototype-estimator.svg)](https://www.npmjs.com/package/@requestnetwork/prototype-estimator)                                         | Give estimates of size and throughput of the Request sytem      |
| [`@requestnetwork/request-logic`](/packages/request-logic)                                                     | [![npm](https://img.shields.io/npm/v/@requestnetwork/request-logic.svg)](https://www.npmjs.com/package/@requestnetwork/request-logic)                                                     | The Request business logic: properties and actions of requests  |
| [`@requestnetwork/request-node`](/packages/request-node)                                                       | [![npm](https://img.shields.io/npm/v/@requestnetwork/request-node.svg)](https://www.npmjs.com/package/@requestnetwork/request-node)                                                       | Web server that allows easy access to Request storage           |
| [`@requestnetwork/transaction-manager`](/packages/transaction-manager)                                         | [![npm](https://img.shields.io/npm/v/@requestnetwork/transaction-manager.svg)](https://www.npmjs.com/package/@requestnetwork/transaction-manager)                                         | Creates transactions to be sent to Data Access                  |
| [`@requestnetwork/types`](/packages/types)                                                                     | [![npm](https://img.shields.io/npm/v/@requestnetwork/types.svg)](https://www.npmjs.com/package/@requestnetwork/types)                                                                     | Typescript types shared across @requestnetwork packages         |
| [`@requestnetwork/utils`](/packages/utils)                                                                     | [![npm](https://img.shields.io/npm/v/@requestnetwork/utils.svg)](https://www.npmjs.com/package/@requestnetwork/utils)                                                                     | Collection of tools shared between the @requestnetwork packages |

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

### Install

`yarn install`

### Build

`yarn run build`

### Lint

`yarn run lint`

### Test

`yarn run test`

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/master/LICENSE)
