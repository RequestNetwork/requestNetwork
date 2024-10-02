<img src="https://raw.githubusercontent.com/RequestNetwork/Request/master/Hubs/Request%20Logos/OnLight/png/Request_onlight_reg_green.png" width="400px" >

---

[![CircleCI](https://img.shields.io/circleci/project/github/RequestNetwork/requestNetwork/master.svg)](https://circleci.com/gh/RequestNetwork/requestNetwork)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/RequestNetwork/requestNetwork.svg?color=green)](https://github.com/RequestNetwork/requestNetwork/pulse/monthly)

[Request][website-url] is a decentralized network built on top of Ethereum, which allows anyone, anywhere to request a payment. A full description of the protocol may be found in our [whitepaper][whitepaper-url].

This repository contains all the Request Network developer tools written in TypeScript.

Join the [Request Discord][request-discord-url] to get in touch with us.

[website-url]: https://request.network
[whitepaper-url]: https://request.network/assets/pdf/request_whitepaper.pdf
[request-discord-url]: https://request.network/discord

### Published Packages

| Package                                                                  | Version                                                                                                                                             | Description                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`@requestnetwork/advanced-logic`](/packages/advanced-logic)             | [![npm](https://img.shields.io/npm/v/@requestnetwork/advanced-logic.svg)](https://www.npmjs.com/package/@requestnetwork/advanced-logic)             | Extensions to the protocol                                          |
| [`@requestnetwork/request-client.js`](/packages/request-client.js)       | [![npm](https://img.shields.io/npm/v/@requestnetwork/request-client.js.svg)](https://www.npmjs.com/package/@requestnetwork/request-client.js)       | Library to use Request nodes as servers                             |
| [`@requestnetwork/data-access`](/packages/data-access)                   | [![npm](https://img.shields.io/npm/v/@requestnetwork/data-access.svg)](https://www.npmjs.com/package/@requestnetwork/data-access)                   | Indexing an batching of transactions                                |
| [`@requestnetwork/data-format`](/packages/data-format)                   | [![npm](https://img.shields.io/npm/v/@requestnetwork/data-format.svg)](https://www.npmjs.com/package/@requestnetwork/data-format)                   | Standards for data stored on Request, like invoices format          |
| [`@requestnetwork/epk-signature`](/packages/epk-signature)               | [![npm](https://img.shields.io/npm/v/@requestnetwork/epk-signature.svg)](https://www.npmjs.com/package/@requestnetwork/epk-signature)               | Sign requests using Ethereum private keys                           |
| [`@requestnetwork/ethereum-storage`](/packages/ethereum-storage)         | [![npm](https://img.shields.io/npm/v/@requestnetwork/ethereum-storage.svg)](https://www.npmjs.com/package/@requestnetwork/ethereum-storage)         | Storage of Request data on Ethereum and IPFS, with custom indexing  |
| [`@requestnetwork/epk-decryption`](/packages/epk-decryption)             | [![npm](https://img.shields.io/npm/v/@requestnetwork/epk-decryption.svg)](https://www.npmjs.com/package/@requestnetwork/epk-decryption)             | Decrypt encrypted requests using Ethereum private keys              |
| [`@requestnetwork/payment-detection`](/packages/payment-detection)       | [![npm](https://img.shields.io/npm/v/@requestnetwork/payment-detection.svg)](https://www.npmjs.com/package/@requestnetwork/payment-detection)       | Client-side payment detection, to compute the balance.              |
| [`@requestnetwork/payment-processor`](/packages/payment-processor)       | [![npm](https://img.shields.io/npm/v/@requestnetwork/payment-processor.svg)](https://www.npmjs.com/package/@requestnetwork/payment-processor)       | Pay a request using a web3 wallet                                   |
| [`@requestnetwork/request-logic`](/packages/request-logic)               | [![npm](https://img.shields.io/npm/v/@requestnetwork/request-logic.svg)](https://www.npmjs.com/package/@requestnetwork/request-logic)               | The Request business logic: properties and actions of requests      |
| [`@requestnetwork/request-node`](/packages/request-node)                 | [![npm](https://img.shields.io/npm/v/@requestnetwork/request-node.svg)](https://www.npmjs.com/package/@requestnetwork/request-node)                 | Web server that allows easy access to Request system                |
| [`@requestnetwork/transaction-manager`](/packages/transaction-manager)   | [![npm](https://img.shields.io/npm/v/@requestnetwork/transaction-manager.svg)](https://www.npmjs.com/package/@requestnetwork/transaction-manager)   | Creates transactions to be sent to Data Access, managing encryption |
| [`@requestnetwork/types`](/packages/types)                               | [![npm](https://img.shields.io/npm/v/@requestnetwork/types.svg)](https://www.npmjs.com/package/@requestnetwork/types)                               | Typescript types shared across @requestnetwork packages             |
| [`@requestnetwork/utils`](/packages/utils)                               | [![npm](https://img.shields.io/npm/v/@requestnetwork/utils.svg)](https://www.npmjs.com/package/@requestnetwork/utils)                               | Collection of tools shared between the @requestnetwork packages     |
| [`@requestnetwork/web3-signature`](/packages/web3-signature)             | [![npm](https://img.shields.io/npm/v/@requestnetwork/web3-signature.svg)](https://www.npmjs.com/package/@requestnetwork/web3-signature)             | Sign requests using web3 tools (like Metamask)                      |
| [`@requestnetwork/multi-format`](/packages/multi-format)                 | [![npm](https://img.shields.io/npm/v/@requestnetwork/multi-format.svg)](https://www.npmjs.com/package/@requestnetwork/multi-format)                 | Serialize and deserialize object in the Request Network protocol    |
| [`@requestnetwork/thegraph-data-access`](/packages/thegraph-data-access) | [![npm](https://img.shields.io/npm/v/@requestnetwork/thegraph-data-access.svg)](https://www.npmjs.com/package/@requestnetwork/thegraph-data-access) | Storage of Request data on Ethereum and IPFS, indexed by TheGraph   |
| [`@requestnetwork/smart-contracts`](/packages/smart-contracts)           | [![npm](https://img.shields.io/npm/v/@requestnetwork/smart-contracts.svg)](https://www.npmjs.com/package/@requestnetwork/smart-contracts)           | Sources and artifacts of the smart contracts                        |

### Private Packages

| Package                                                          | Description                             |
| ---------------------------------------------------------------- | --------------------------------------- |
| [`@requestnetwork/integration-test`](/packages/integration-test) | Integration test for the Request system |
| [`@requestnetwork/toolbox`](/packages/toolbox)                   | Toolbox for Request Network             |
| [`@requestnetwork/usage-example`](/packages/usage-example)       | Usage examples of Request Network       |

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

### Install

Install all the packages in the monorepo.

```bash
yarn install
```

### Build

Build all the packages in the monorepo.

```bash
yarn run build
```

### Lint

Lint all the packages in the monorepo.

```bash
yarn run lint
```

### Test

Test all the packages in the monorepo.

```bash
yarn run test
```

Test a specific package by replacing `@requestnetwork/request-client.js` with the desired package name:

```bash
yarn workspace @requestnetwork/request-client.js test
```

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/master/LICENSE)

## V1 packages

This repository hosts the packages for the second version of Request. The v1 packages are deprecated and can be found on [requestNetwork-v1-archive](https://github.com/RequestNetwork/requestNetwork-v1-archive).
