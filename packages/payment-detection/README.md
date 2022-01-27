# @requestnetwork/payment-detection

`@requestnetwork/payment-detection` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It contains the implementation of request-related events interpretations, typically onchain payments of requests.

The interpretation of events is specified by the payment extension added to the request. [Cf. advanced-logic specifications](../advanced-logic/specs/).

# Balance and events

If a payment network has been given to the request, the payment detection can be done.

Based on information found in the payment network state, and included manual payment declarations, the library will perform queries and feed the property `balance` of the request with:

- `balance`: the detected amount paid on the request, in request currency
- `events`: all the payments, payment declarations, refunds, and other balance-related events with the amount, timestamp etc...

# Design: retrievers and detectors

This library relies on two concepts:

- **Retrievers** perform RPC calls or TheGraph and fetch relevant events. Balance-impacting events are fetched with `InfoRetrievers`, implementing the `getTransferEvents()` method (cf. [IPaymentRetriever](./src/types.ts))
- **Payment detectors** call retrievers and interpret events according to the payment network (cf. [Abstract PaymentDetectorBase](./src/payment-detector-base.ts))

## Subgraph-based payment retrievers

For TheGraph-based information retrieval, we implement a generic method `getTheGraphClient()` in `./src/thegraph/index.ts`, based on the queries in `/src/thegraph/queries` and automated types.

The automated type generation is configured within files `./codegen.yml` (for EVM chains) and `./codegen-near.yml` (for Near) and output in `./src/thegraph/generated`. It depends on the deployed subgraphes schema and on the queries.

The code generation is included in the pre-build script and can be run manually:

```
yarn codegen
```
