---
title: How to contribute to the Request Protocol
sidebar_label: How to contribute to the Request Protocol
description: >-
  Below you can find all information about how to contribute to the Request
  protocol.
---

## Guidelines for contributors

Check the contribution guidelines: [https://github.com/RequestNetwork/requestNetwork/blob/development/CONTRIBUTING.md](https://github.com/RequestNetwork/requestNetwork/blob/development/CONTRIBUTING.md)

Join the [Request Hub on Slack](https://requesthub.slack.com/join/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA).

Visit our [github to view the issues](https://github.com/RequestNetwork/requestNetwork/issues) or create a new one.

## Monorepo

The[ repository](https://github.com/RequestNetwork/requestNetwork) of the protocol is a monorepo, using [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [lerna](https://github.com/lerna/lerna). It holds every package composing the typescript implementation of the protocol, as well as the specifications.

## Building and Running

### Build all packages

1. `git clone https://github.com/RequestNetwork/requestNetwork.git`
2. `yarn run build`

Sometimes it helps to run `yarn run build:tsc` to fix typescript build problems.

### Lint all packages

1. `git clone https://github.com/RequestNetwork/requestNetwork.git`
2. `yarn run lint`
3. `yarn run packageJsonLint`

### Run all the tests

1. `git clone https://github.com/RequestNetwork/requestNetwork.git`
2. Console 1: Run IPFS
   1. Install and setup an IPFS node
   2. `ipfs daemon`
3. Console 2: Run ganache
   1. `cd packages/ethereum-storage`
   2. `yarn run ganache`
4. Console 3: deploy the contracts and run the tests
   1. `cd packages/ethereum-storage`
   2. `yarn run deploy`
   3. `cd ../`
   4. `yarn run test`

### CircleCI Build

We use CircleCI to build the projects of the monorepo: [https://circleci.com/gh/RequestNetwork/requestNetwork](https://circleci.com/gh/RequestNetwork/requestNetwork)

## Readings

Good readings for anyone interested in developing on the protocol:

- [Whitepaper](https://request.network/assets/pdf/request_whitepaper.pdf)
- [Yellow paper](https://request.network/assets/pdf/request_yellowpaper_smart_audits.pdf)
- [Why use Request?](https://blog.request.network/why-use-request-b28c3e788261)
- [FAQ blog post](https://blog.request.network/colossuss-frequently-asked-questions-faq-c086231b88fa)
- [Types of Request & Financial flows management — Request types](https://blog.request.network/request-network-project-update-december-8th-2017-financial-flows-management-request-colossus-ef62fed295c0)
- [The invoicing and reputation system](https://blog.request.network/the-invoicing-reputation-system-by-request-network-977831469cdc)
